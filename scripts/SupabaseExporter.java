import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import org.json.*;

/**
 * Script Java para exportar todas as tabelas do Supabase para arquivos JSON.
 * 
 * INSTRUÇÕES DE USO:
 * 1. Baixe o JAR do JSON: https://repo1.maven.org/maven2/org/json/json/20231013/json-20231013.jar
 * 2. Compile: javac -cp .;json-20231013.jar SupabaseExporter.java
 * 3. Execute: java -cp .;json-20231013.jar SupabaseExporter
 * 
 * Ou use sem dependências externas (versão simplificada abaixo).
 */
public class SupabaseExporter {
    
    // ============== CONFIGURAÇÃO ==============
    // Substitua pelos valores do seu Supabase
    private static final String SUPABASE_URL = "https://mpkpqobxuepssidehuuw.supabase.co";
    private static final String SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wa3Bxb2J4dWVwc3NpZGVodXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MTY4MzQsImV4cCI6MjA4NDE5MjgzNH0.MEKWDsE_PcFIUIdjZ_iwMFLbTF21UDi3cMVUsEalHbI";
    
    // Diretório onde os arquivos serão salvos
    private static final String OUTPUT_DIR = "supabase_export";
    
    // Lista de tabelas para exportar (adicione suas tabelas aqui)
    private static final String[] TABLES = {
        "profiles",
        "patients",
        "consultations",
        "appointments",
        "questions",
        "simulados",
        "simulado_questions",
        "user_answers",
        "study_sessions",
        "notifications",
        "settings"
        // Adicione mais tabelas conforme necessário
    };
    
    public static void main(String[] args) {
        System.out.println("===========================================");
        System.out.println("    Supabase Table Exporter - Java");
        System.out.println("===========================================\n");
        
        // Criar diretório de saída
        File outputDir = new File(OUTPUT_DIR);
        if (!outputDir.exists()) {
            outputDir.mkdirs();
            System.out.println("✓ Diretório criado: " + OUTPUT_DIR);
        }
        
        int successCount = 0;
        int errorCount = 0;
        
        for (String table : TABLES) {
            System.out.print("Exportando tabela '" + table + "'... ");
            try {
                String data = fetchTableData(table);
                if (data != null && !data.equals("[]")) {
                    saveToFile(table, data);
                    System.out.println("✓ OK");
                    successCount++;
                } else if (data != null && data.equals("[]")) {
                    System.out.println("⚠ Vazia (sem dados)");
                    saveToFile(table, data);
                    successCount++;
                } else {
                    System.out.println("✗ Erro: dados nulos");
                    errorCount++;
                }
            } catch (Exception e) {
                System.out.println("✗ Erro: " + e.getMessage());
                errorCount++;
            }
        }
        
        System.out.println("\n===========================================");
        System.out.println("    RESUMO DA EXPORTAÇÃO");
        System.out.println("===========================================");
        System.out.println("Tabelas exportadas com sucesso: " + successCount);
        System.out.println("Tabelas com erro: " + errorCount);
        System.out.println("Arquivos salvos em: " + new File(OUTPUT_DIR).getAbsolutePath());
        System.out.println("===========================================");
    }
    
    /**
     * Faz uma requisição GET para a API REST do Supabase para obter os dados da tabela.
     */
    private static String fetchTableData(String tableName) throws Exception {
        String urlString = SUPABASE_URL + "/rest/v1/" + tableName + "?select=*";
        
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        conn.setRequestMethod("GET");
        conn.setRequestProperty("apikey", SUPABASE_ANON_KEY);
        conn.setRequestProperty("Authorization", "Bearer " + SUPABASE_ANON_KEY);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Prefer", "return=representation");
        
        int responseCode = conn.getResponseCode();
        
        if (responseCode == 200) {
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
            );
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            return response.toString();
        } else {
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8)
            );
            StringBuilder error = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                error.append(line);
            }
            reader.close();
            throw new Exception("HTTP " + responseCode + ": " + error.toString());
        }
    }
    
    /**
     * Salva os dados em um arquivo JSON.
     */
    private static void saveToFile(String tableName, String data) throws IOException {
        String filename = OUTPUT_DIR + "/" + tableName + ".json";
        
        // Formatar JSON de forma bonita (indentado)
        String prettyJson = formatJson(data);
        
        Files.write(
            Paths.get(filename), 
            prettyJson.getBytes(StandardCharsets.UTF_8)
        );
    }
    
    /**
     * Formata o JSON com indentação para facilitar a leitura.
     */
    private static String formatJson(String json) {
        StringBuilder formatted = new StringBuilder();
        int indent = 0;
        boolean inString = false;
        
        for (char c : json.toCharArray()) {
            if (c == '"' && (formatted.length() == 0 || formatted.charAt(formatted.length() - 1) != '\\')) {
                inString = !inString;
            }
            
            if (!inString) {
                if (c == '{' || c == '[') {
                    formatted.append(c);
                    formatted.append("\n");
                    indent++;
                    formatted.append(getIndent(indent));
                } else if (c == '}' || c == ']') {
                    formatted.append("\n");
                    indent--;
                    formatted.append(getIndent(indent));
                    formatted.append(c);
                } else if (c == ',') {
                    formatted.append(c);
                    formatted.append("\n");
                    formatted.append(getIndent(indent));
                } else if (c == ':') {
                    formatted.append(c);
                    formatted.append(" ");
                } else if (!Character.isWhitespace(c)) {
                    formatted.append(c);
                }
            } else {
                formatted.append(c);
            }
        }
        
        return formatted.toString();
    }
    
    private static String getIndent(int level) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < level; i++) {
            sb.append("  ");
        }
        return sb.toString();
    }
}
