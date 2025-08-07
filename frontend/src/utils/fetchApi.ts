import { EndpointIO, EndpointParams, EndpointRequest, EndpointResponse, endpointSignatures } from "../../../types/api.ts";

export async function fetchApi<const E extends keyof EndpointIO>(endpoint: E, params: EndpointParams<E>, data: EndpointRequest<E> = {}): Promise<EndpointResponse<E>> {
    let endpt: string = endpointSignatures[endpoint][1];
    for (const [key, val] of Object.entries(params)) { endpt = endpt.replace(`:${key}`, val as string); }
    
    const token = sessionStorage.getItem('Token');
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return (await fetch(`http://localhost:3000/api${endpt}`, {
        method: endpointSignatures[endpoint][0],
        headers, 
        body: Object.keys(data).length > 0 ? JSON.stringify(data) : undefined
    })).json();
};