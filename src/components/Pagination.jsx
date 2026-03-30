// 負責處理分頁跳轉。
// 1. 邏輯：接收 pagination 物件，利用 Array.from 根據 total_pages 產生數字按鈕。
// 2. 防錯：當 has_pre 或 has_next 為 false 時，加上 Bootstrap 的 disabled 樣式。

function Pagination({pagination , onChangePage}) {
    if (!pagination || !pagination.total_pages) return null;

    const handleClick = (e, page) => {
        e.preventDefault()
        onChangePage(page)
    }

    return(
        <nav aria-label="Page navigation example">
            <ul className="pagination justify-content-center">
                <li className={`page-item ${!pagination.has_pre && 'disabled'}`}>
                    <a className="page-link" href="#" aria-label="Previous"
                    onClick={(e) => handleClick(e, pagination.current_page - 1)}
                    >
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
                {
                    Array.from({length:pagination.total_pages} , (_, index) => (
                        <li className={`page-item ${pagination.current_page === index + 1 && "active"}`} key={`${index}_page`}>
                            <a className="page-link" href="#"
                            onClick={(e) => handleClick(e, index+1)}
                            >
                                {index + 1}
                            </a>
                        </li>
                    ))
                }
                <li className={`page-item ${!pagination.has_next && 'disabled'}`}>
                <a className="page-link" 
                    href="#" 
                    onClick={(e) => handleClick(e, pagination.current_page + 1)}
                    aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
                </li>
            </ul>
        </nav>
    )
}

export default Pagination;