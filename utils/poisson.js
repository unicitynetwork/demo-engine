// utils/poisson.js

function validateSpace(width, height, radius) {
    const areaTotal = width * height;
    const areaPerAgent = Math.PI * Math.pow(radius * 2, 2);
    const theoreticalMaxAgents = Math.floor(areaTotal / areaPerAgent);
    
    return {
    isValid: theoreticalMaxAgents >= 1,
    maxAgents: theoreticalMaxAgents,
    minRadius: Math.sqrt(areaTotal / (Math.PI * 4)) / 10
    };
}
  

function generateRandomPoints(width, height, radius, targetCount, maxAttempts = 10000) {
    const minDist = radius * 2;
    const points = [];
    let attempts = 0;
    
    while (points.length < targetCount && attempts < maxAttempts) {
        // Generate a random point
        const newPoint = {
            x: Math.random() * width,
            y: Math.random() * height,
            radius: radius
        };

        // Check minimum distance with ALL existing points
        let isValidPoint = true;
        for (const existingPoint of points) {
            const dx = existingPoint.x - newPoint.x;
            const dy = existingPoint.y - newPoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                isValidPoint = false;
                break;
            }
        }

        if (isValidPoint) {
            points.push(newPoint);
        }
        
        attempts++;
    }

    return {
        success: points.length === targetCount,
        points: points,
        attempts: attempts,
        placedAgents: points.length
    };
}
  
function pointToGrid(point, cellSize) {
    return {
        x: Math.floor(point.x / cellSize),
        y: Math.floor(point.y / cellSize)
    };
}
  
function isValid(point, width, height, cellSize, grid, cols, rows, minDist) {
    if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) {
        return false;
    }
    
    const gridPoint = pointToGrid(point, cellSize, cols);
    const startX = Math.max(0, gridPoint.x - 2);
    const endX = Math.min(cols - 1, gridPoint.x + 2);
    const startY = Math.max(0, gridPoint.y - 2);
    const endY = Math.min(rows - 1, gridPoint.y + 2);
    
    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            const existingPoint = grid[y * cols + x];
            if (existingPoint) {
                const dx = existingPoint.x - point.x;
                const dy = existingPoint.y - point.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

module.exports = {
    validateSpace,
    generateRandomPoints
};