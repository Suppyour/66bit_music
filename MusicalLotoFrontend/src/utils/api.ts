export const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    return fetch(url, { ...options, headers });
};
