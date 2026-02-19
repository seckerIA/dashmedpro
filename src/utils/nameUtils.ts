
/**
 * Formata o nome para exibição, identificando prefixos como "Dr." ou "Dra."
 */
export const getProfileDisplayData = (fullName: string | null | undefined, defaultText: string = 'Doutor') => {
    if (!fullName) return { name: defaultText, prefix: 'Dr.' };

    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 0) return { name: defaultText, prefix: 'Dr.' };

    const firstPart = nameParts[0].toLowerCase().replace('.', '');

    if (firstPart === 'dra' || firstPart === 'doutora') {
        return {
            name: nameParts[1] || nameParts[0],
            prefix: 'Dra.'
        };
    }

    if (firstPart === 'dr' || firstPart === 'doutor') {
        return {
            name: nameParts[1] || nameParts[0],
            prefix: 'Dr.'
        };
    }

    // Se não tem prefixo, tenta inferir ou usa default
    return {
        name: nameParts[0],
        prefix: 'Dr.' // Default
    };
};

/**
 * Retorna apenas o primeiro nome, removendo prefixos redundantes.
 */
export const formatDisplayName = (fullName: string | null | undefined, defaultText: string = 'Doutor'): string => {
    return getProfileDisplayData(fullName, defaultText).name;
};
