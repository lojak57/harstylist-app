// Helper function to get colors for service categories
export function getCategoryColor(category: string) {
    switch (category?.toLowerCase()) {
        case 'both':
            return { bgColor: '#dcfce7', textColor: '#166534' }; // Green
        case 'men':
            return { bgColor: '#dbeafe', textColor: '#1e40af' }; // Blue
        case 'women':
            return { bgColor: '#f3e8ff', textColor: '#6b21a8' }; // Purple
        case 'children':
            return { bgColor: '#fef3c7', textColor: '#92400e' }; // Amber
        default:
            return { bgColor: '#f3f4f6', textColor: '#374151' }; // Gray
    }
}
