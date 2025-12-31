## Visão Geral

Corrigir o erro `createRecord is not a function` no componente `NewRecordModal.tsx`. O problema ocorre porque `createRecord` é um objeto `useMutation` do React Query, não uma função direta, e precisa ser chamado usando `.mutate()` ou `.mutateAsync()`.

## Análise do Problema

**Arquivo afetado**: `src/components/medical-records/NewRecordModal.tsx`

**Erro atual** (linha 125):
```typescript
createRecord(recordInput, {
  onSuccess: () => {
    onOpenChange(false);
    resetForm();
  },
});
```

**Problema**: `createRecord` é retornado do hook `useMedicalRecords` como um objeto `useMutation`, não uma função. O código está tentando chamá-lo como função direta.

**Solução**: Usar `createRecord.mutateAsync()` para executar a mutation de forma assíncrona e aguardar o resultado.

## Estrutura de Mudanças

### 1. Corrigir função handleSubmit

**Arquivo**: `src/components/medical-records/NewRecordModal.tsx`

**Mudanças necessárias**:
- Converter `handleSubmit` para função `async`
- Substituir `createRecord(recordInput, { onSuccess: ... })` por `createRecord.mutateAsync(recordInput)`
- Adicionar tratamento de erro com try/catch
- Mover lógica de `onSuccess` para após o `await`

**Código atual** (linhas 114-131):
```typescript
const handleSubmit = (data: RecordFormData) => {
  const recordInput: CreateMedicalRecordInput = {
    contact_id: contactId,
    ...data,
    vital_signs: Object.keys(vitalSigns).length > 0 ? { ...vitalSigns, bmi: bmi || undefined } : undefined,
    allergies_noted: allergiesNoted.length > 0 ? allergiesNoted : undefined,
    cid_codes: cidCodes.length > 0 ? cidCodes : undefined,
    prescriptions: prescriptions.length > 0 ? prescriptions : undefined,
    exams_requested: examsRequested.length > 0 ? examsRequested : undefined,
  };

  createRecord(recordInput, {
    onSuccess: () => {
      onOpenChange(false);
      resetForm();
    },
  });
};
```

**Código corrigido**:
```typescript
const handleSubmit = async (data: RecordFormData) => {
  const recordInput: CreateMedicalRecordInput = {
    contact_id: contactId,
    ...data,
    vital_signs: Object.keys(vitalSigns).length > 0 ? { ...vitalSigns, bmi: bmi || undefined } : undefined,
    allergies_noted: allergiesNoted.length > 0 ? allergiesNoted : undefined,
    cid_codes: cidCodes.length > 0 ? cidCodes : undefined,
    prescriptions: prescriptions.length > 0 ? prescriptions : undefined,
    exams_requested: examsRequested.length > 0 ? examsRequested : undefined,
  };

  try {
    await createRecord.mutateAsync(recordInput);
    onOpenChange(false);
    resetForm();
  } catch (error) {
    // Erro já é tratado pelo hook useMedicalRecords com toast
    console.error('Erro ao criar prontuário:', error);
  }
};
```

### 2. Verificar se há outros usos incorretos

**Verificar**: Se há outros lugares no código que usam `createRecord` de forma incorreta.

**Arquivos a verificar**:
- `src/components/medical-records/MedicalRecordForm.tsx` (já usa corretamente com `mutateAsync`)
- Outros componentes que usam `useMedicalRecords`

## Ordem de Implementação

1. **Corrigir handleSubmit no NewRecordModal.tsx**
   - Converter para função async
   - Substituir chamada direta por `mutateAsync`
   - Adicionar tratamento de erro

2. **Verificar outros componentes**
   - Buscar por outros usos de `createRecord` que possam estar incorretos
   - Garantir consistência no padrão de uso

3. **Testar a correção**
   - Testar criação de novo prontuário
   - Verificar se o modal fecha corretamente após sucesso
   - Verificar se erros são tratados adequadamente

## Considerações Importantes

- **Padrão do React Query**: Mutations do React Query devem ser chamadas usando `.mutate()` ou `.mutateAsync()`
- **Tratamento de erros**: O hook `useMedicalRecords` já trata erros com toast, então não é necessário mostrar toast adicional no componente
- **Loading state**: O `isCreating` já está sendo usado corretamente no botão de submit
- **Consistência**: Manter o mesmo padrão usado em `MedicalRecordForm.tsx` que já usa `mutateAsync` corretamente

## Resultado Esperado

Após a correção:
- O formulário deve salvar o prontuário corretamente
- O modal deve fechar após sucesso
- O formulário deve ser resetado após sucesso
- Erros devem ser tratados e exibidos via toast (pelo hook)
- O botão deve mostrar estado de loading durante a operação
