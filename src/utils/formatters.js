export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(value || 0);

export const formatNumber = (value = 0) => new Intl.NumberFormat('es-SV').format(value || 0);

export const formatShortDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit' });
};
