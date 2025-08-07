export function createBase64(obj: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            const dataUrl = reader.result as string; // e.g. "data:image/png;base64,iVBORw0..."
            resolve(dataUrl);
        };

        reader.onerror = reject;

        reader.readAsDataURL(obj);
    });
}