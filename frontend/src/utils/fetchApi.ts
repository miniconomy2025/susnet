import { EndpointIO, EndpointRequest, EndpointResponse, endpointSignatures } from "../../../types/api.ts";

export const fetchApi = async <const T extends keyof EndpointIO>(endpoint: T, data: EndpointRequest<T>): Promise<EndpointResponse<T>> => (
    (await fetch(`http://localhost:3000/api${endpointSignatures[endpoint][1]}`, {
        method: endpointSignatures[endpoint][0],
        headers: { "Content-Type": "application/json" }
    })).json()
);