export const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-change'));
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    }

    return response;
};
