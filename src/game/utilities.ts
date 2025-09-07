export function range(start: number, end: number) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export const rotatePointsAroundCenter = (points: {x: number, y: number}[], rotationDegrees: number, imageSize: number = 1024) => {
    const center = imageSize / 2; // 512 for 1024x1024 images
    const rotationRadians = (rotationDegrees * Math.PI) / 180;

    return points.map(point => {
        // Translate point to origin (relative to center)
        const translatedX = point.x - center;
        const translatedY = point.y - center;

        // Apply rotation
        const rotatedX = translatedX * Math.cos(rotationRadians) - translatedY * Math.sin(rotationRadians);
        const rotatedY = translatedX * Math.sin(rotationRadians) + translatedY * Math.cos(rotationRadians);

        // Translate back to original coordinate system
        return {
            x: rotatedX + center,
            y: rotatedY + center
        };
    });
};
