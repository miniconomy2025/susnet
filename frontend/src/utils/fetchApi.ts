import { EndpointIO, EndpointParams, EndpointRequest, EndpointResponse, endpointSignatures } from "../../../types/api.ts";

export async function fetchApi<const E extends keyof EndpointIO>(endpoint: E, params: EndpointParams<E>, data: EndpointRequest<E> = {}): Promise<EndpointResponse<E>> {
    let endpt: string = endpointSignatures[endpoint][1];
    for (const [key, val] of Object.entries(params)) { endpt = endpt.replace(`:${key}`, val as string); }
    
    const token = sessionStorage.getItem('Token');
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`http://susnet.co.za/api${endpt}`, {
        method: endpointSignatures[endpoint][0],
        headers, 
        body: Object.keys(data).length > 0 ? JSON.stringify(data) : undefined
    });

    if (response.status === 401) {
        sessionStorage.removeItem('Token');
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
        throw new Error('Token expired');
    }

    return response.json();
};