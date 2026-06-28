export const environment = {
  production: true,
  // Em produção o frontend é servido na mesma origem; nginx faz proxy de /api → backend
  // (location /api/ { proxy_pass http://upstream/; } remove o prefixo /api).
  apiBase: '/api',
};
