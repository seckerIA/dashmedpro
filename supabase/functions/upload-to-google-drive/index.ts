import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_CLIENT_ID = '510442253393-rd4mr1neifr9fl7eimgokevu5rvsu0fn.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET = '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'
const SVM_FOLDER_ID = '1B79OuHQl9kLwytGyF7LkcnWG53evI7G2'
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

interface UploadRequest {
  fileName: string
  fileContent: string // base64
  fileType: string
  description?: string
}

interface GoogleDriveFile {
  id: string
  name: string
  webViewLink: string
  webContentLink: string
  size: string
  mimeType: string
}

// Função para obter token de acesso usando Service Account
async function getAccessToken(): Promise<string> {
  // Para produção, você deve usar Service Account credentials
  // Por enquanto, vamos usar um token de acesso direto
  // Em produção, implemente autenticação com Service Account
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      scope: GOOGLE_SCOPE,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get access token')
  }

  const data = await response.json()
  return data.access_token
}

// Função para criar pasta se não existir
async function ensureFolderExists(accessToken: string, folderName: string, parentId?: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' })
  
  // Criar pasta do ano se não existir
  const yearFolderId = await createFolder(accessToken, currentYear.toString(), parentId || SVM_FOLDER_ID)
  
  // Criar pasta do mês se não existir
  const monthFolderId = await createFolder(accessToken, currentMonth, yearFolderId)
  
  return monthFolderId
}

// Função para criar pasta
async function createFolder(accessToken: string, folderName: string, parentId?: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Error creating folder:', error)
    throw new Error('Failed to create folder')
  }

  const folder = await response.json()
  return folder.id
}

// Função para fazer upload do arquivo
async function uploadFileToGoogleDrive(
  accessToken: string,
  file: UploadRequest,
  folderId: string
): Promise<GoogleDriveFile> {
  // Preparar metadados do arquivo
  const metadata = {
    name: file.fileName,
    parents: [folderId],
    description: file.description || `Upload automático - ${new Date().toISOString()}`,
  }

  // Converter base64 para blob
  const fileContent = Uint8Array.from(atob(file.fileContent), c => c.charCodeAt(0))
  const blob = new Blob([fileContent], { type: file.fileType })

  // Criar FormData para upload
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', blob, file.fileName)

  // Upload do arquivo
  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,mimeType',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: form,
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload file to Google Drive')
  }

  const uploadedFile = await response.json()
  
  return {
    id: uploadedFile.id,
    name: uploadedFile.name,
    webViewLink: uploadedFile.webViewLink,
    webContentLink: uploadedFile.webContentLink,
    size: uploadedFile.size || '0',
    mimeType: uploadedFile.mimeType,
  }
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { fileName, fileContent, fileType, description }: UploadRequest = await req.json()

    if (!fileName || !fileContent || !fileType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Obter token de acesso
    const accessToken = await getAccessToken()
    
    // Garantir que a pasta existe
    const folderId = await ensureFolderExists(accessToken, fileName)
    
    // Fazer upload do arquivo
    const uploadedFile = await uploadFileToGoogleDrive(accessToken, {
      fileName,
      fileContent,
      fileType,
      description,
    }, folderId)

    return new Response(JSON.stringify({
      success: true,
      file: uploadedFile,
      message: 'File uploaded to Google Drive successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in upload-to-google-drive function:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
