import axios from 'axios';

// Criamos uma única instância apontando para o Render
const api = axios.create({
  baseURL: 'https://peluma-pijamas.onrender.com',
});

// Configuramos o interceptor para enviar o token em TODAS as chamadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ========================
   PRODUTOS
======================== */
export const listarProdutos = async () => {
  const response = await api.get('/produtos');
  return response.data;
};

export default api;