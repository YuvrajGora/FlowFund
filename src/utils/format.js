export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
};

export const getLocalYearMonth = (dateStr) => {
    const d = new Date(dateStr);
    return {
        year: d.getFullYear(),
        month: d.getMonth() // 0-indexed
    };
};
