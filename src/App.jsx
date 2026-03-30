// 主線任務四

// 負責管理全域狀態（如產品清單、分頁資訊）以及控制 Modal 的開關。
// 核心流程：
// 1. 掛載檢查：useEffect 會先從 Cookie 抓取 Token，並執行 checkLogin 驗證 Token 是否有效。
// 2. 狀態分流：利用 isAuth 布林值決定顯示「登入畫面」或「產品後台」。
// 3. Modal 控制：使用 useRef 儲存 Bootstrap Modal 實例，不透過 React 渲染控制顯示，而是透過原生 JS 方法 modalInstance.current.show()。

import { useState, useEffect, useRef } from 'react';
import axios from "axios";
import * as bootstrap from "bootstrap";
import ProductModal from "./components/ProductModal";
import Pagination from "./components/Pagination";
import Login from "./views/Login";
import "./assets/style.css";


const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;


const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [], 
  shipping:"",
};

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState(""); 
  const [pagination, setPagination] = useState({});
  const productModalRef = useRef(null);

  const getProducts = async (page=1) => {
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products?page=${page}`,);
      setProducts(response.data.products); 
      setPagination(response.data.pagination);
    } catch (error) {
      alert("存取失敗：" + (error.response?.data?.message || "請檢查 API 是否有誤"));
    }
  }

  
  const checkLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE}/api/user/check`);
      console.log(response.data);
      setIsAuth(true);
      getProducts();
    } catch (error) {
      setIsAuth(false);
      alert("尚未登入：" + (error.response?.data?.message || "請先登入"));
    }
  };

  const modalDOM = useRef(null);
  const modalInstance = useRef(null);

  useEffect(() => {
    // 從 Cookie 取出 token 並放入 Headers
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];
      if(token){
        axios.defaults.headers.common['Authorization'] = token;
      }
    
    // 初始化 Bootstrap Modal 實例，儲存在 ref 中避免重新渲染時遺失
    if (modalDOM.current) {
      modalInstance.current = new bootstrap.Modal(modalDOM.current, {
        keyboard: false,
      });
    }

    checkLogin();

  }, []); 

  const openModal = (type, product) => {
    setModalType(type);
    setTemplateProduct({ 
      ...INITIAL_TEMPLATE_DATA, 
      ...product,
      imagesUrl: product.imagesUrl ? [...product.imagesUrl] : [] 
    });
    modalInstance.current.show(); 
  };

  const closeModal = () => {
    modalInstance.current.hide(); 
  };

  return (
    <>
    {!isAuth ? (   
    <Login getProducts={getProducts} setIsAuth={setIsAuth} />
    ) : (
        <div className='container'>
              <h2 className="">產品列表</h2>
              <div className="text-end mt-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openModal("create",INITIAL_TEMPLATE_DATA)}>
                  建立新的產品
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">分類</th>
                    <th scope="col">產品名稱</th>
                    <th scope="col">原價</th>
                    <th scope="col">售價</th>
                    <th scope="col">是否啟用</th>
                    <th scope="col">編輯</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.category}</td>
                      <th scope="row">{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td className={`${product.is_enabled && 'text-success'}`}>{product.is_enabled ? "啟用" : "未啟用"}</td>
                      <td>
                        <div className="btn-group" role="group" aria-label="Basic example">
                          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => openModal('edit', product)}>編輯</button>
                          <button type="button" className="btn btn-outline-danger btn-sm"  onClick={() => openModal('delete', product)}>刪除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination pagination={pagination} onChangePage={getProducts}/>
        </div>
      )
    }

    <ProductModal
      modalDOM={modalDOM} 
      modalType={modalType}
      templateProduct={templateProduct}
      getProducts={getProducts}
      closeModal={closeModal}
    />
  </>

  );
}

export default App
