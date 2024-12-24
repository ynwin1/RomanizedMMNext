export const generatePagination = (currentPage: number, totalPages: number) => {
    // For 5 or fewer pages, show all pages without ellipses
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // For pages 1-3, show the first 3 pages, an ellipsis, and the last page
    if (currentPage <= 3) {
        if (currentPage === 3) {
            return [1, 2, 3, 4, '...', totalPages];
        } else {
            return [1, 2, 3, '...', totalPages];
        }
    }

    // for pages totalPages-2 to totalPages, show the first page, an ellipsis, and the last 3 pages
    if (currentPage >= totalPages - 2) {
        if (currentPage === totalPages - 2) {
            return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            return [1, '...', totalPages - 2, totalPages - 1, totalPages];
        }
    }

    // else show middle pages with neighbors surrounded by ellipses and the first and last pages
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};