import React from 'react';

const TasksDebug = () => {
  console.log('[TasksDebug] Componente renderizado com sucesso');
  
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">Debug - Página de Tarefas</h1>
      <div className="space-y-4">
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg">
          <p className="text-lg font-semibold">✅ Componente carregou com sucesso!</p>
          <p className="text-sm mt-2">Se você está vendo esta mensagem, o roteamento está funcionando.</p>
        </div>
        
        <div className="p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
          <p className="text-lg font-semibold">🔍 Verificações:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>React: OK</li>
            <li>Roteamento: OK</li>
            <li>Tailwind CSS: OK</li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
          <p className="text-lg font-semibold">📝 Próximo passo:</p>
          <p className="text-sm mt-2">Abra o console (F12) e verifique se há logs começando com [Tasks]</p>
        </div>
      </div>
    </div>
  );
};

export default TasksDebug;
