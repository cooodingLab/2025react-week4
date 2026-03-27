// 主線任務三
//【準備工具箱】
// 載入 React 的三大法寶、負責送信的 axios，以及負責美化畫面的 bootstrap
import { useEffect, useState, useRef } from 'react';
import axios from "axios";
import * as bootstrap from "bootstrap";
import "./assets/style.css";

// API 設定
// 從環境變數 (像是保險箱) 裡拿出 API 的網址和路徑
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

// 【準備一張空白的商品卡】
// 每次要新增商品時，就拿這張全空的卡片來填寫
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
  imagesUrl: [], // 這裡是可以放很多張副圖的陣列
};

function App() {
  // ==========================================
  // 【第二步：大腦記憶區 (State 狀態)】
  // ==========================================
  
  // 1. 記住「登入表單」輸入的帳號密碼
  const [formData, setFormData] = useState({
    username:"",
    password:"",
  });
  // 2. 記住「有沒有登入成功？」(預設是 false 還沒登入)
  const [isAuth, setIsAuth] = useState(false);
  // 3. 記住從伺服器拿回來的「所有產品清單」
  const [products, setProducts] = useState([]);
  // 4. 記住「現在正在編輯或準備新增的商品資料」
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  // 5. 記住彈出視窗 (Modal) 現在的任務：是要 'create'(新增)、'edit'(編輯) 還是 'delete'(刪除)？
  const [modalType, setModalType] = useState(""); 
  // 6. 準備一根魔法指揮棒，用來操控 Bootstrap 的彈出視窗
  const productModalRef = useRef(null);

  // ==========================================
  // 【第三步：各種動作與小幫手 (Functions)】
  // ==========================================
  
  // 當使用者在「登入表單」打字時，把字抄寫到 formData 筆記本裡
  const handleInputChange = (e) => {
    const {name, value} = e.target
    setFormData((preData) => ({
      ...preData,
      [name]:value,
    }));
  };

  // 當使用者在「產品彈出視窗」填寫資料時，把字抄寫到 templateProduct 裡
  const handleModalInputChange = (e) => {
    const {name, value, checked, type} = e.target
    setTemplateProduct((preData) => ({
      ...preData,
      // 如果是勾選框 (checkbox)，就存 true/false；不然就存輸入的文字
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 處理「多張副圖」
  const handleModalImageChange = (index, value) => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage[index] = value; // 更新目前這格的網址

      // 如果填了網址、而且是最後一格、且總數還不到 5 張 -> 自動變出下一個空位！
      if (
        value !== "" &&
        index === newImage.length - 1 &&
        newImage.length < 5
        ) {
          newImage.push("");
        }

      // 如果清空了網址、而且不是唯一的一格、且最後一格也是空的 -> 把多餘的空位收起來！
      if (
        value === "" &&
        newImage.length > 1 &&
        newImage[newImage.length - 1] === ""
        ) {
          newImage.pop();
        }

      return{
        ...pre,
        imagesUrl:newImage,
      };
    });
  };

  // 點擊「新增圖片」按鈕
  const handleAddImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.push("");
      return{
        ...pre,
        imagesUrl:newImage,
      };
    });
  };

  // 點擊「刪除圖片」按鈕
  const handleRemoveImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.pop();
      return{
        ...pre,
        imagesUrl:newImage,
      };
    });
  };



  // 請 axios 把「所有產品資料」拿回來
  const getProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      setProducts(response.data.products); // 把拿到的資料存進大腦
    } catch (error) {
      alert("存取失敗：" + (error.response?.data?.message || "請檢查 API 是否有誤"));
    }
  }

  // 檢查通行證 (Token) 還能不能用
  const checkLogin = async () => {
    try {
      // 驗證 Token 是否有效
      const response = await axios.post(`${API_BASE}/api/user/check`);
      console.log(response.data);
      setIsAuth(true); // 通過檢查，設為已登入
      getProducts(); // 趕快去拿產品資料
    } catch (error) {
      setIsAuth(false); // 檢查失敗，退回登入畫面
      alert("尚未登入：" + (error.response?.data?.message || "請先登入"));
    }
  };


  // 存檔！把「新增」或「編輯」好的產品資料送給伺服器
  const updateProduct = async (id) => {
    // 預設是「新增 (post)」
    let url = `${API_BASE}/api/${API_PATH}/admin/product`
    let method = 'post'

    // 如果任務是「編輯 (edit)」，就改成編輯專用的網址和方法 (put)
    if(modalType === 'edit'){
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`
      method = 'put'
    }

    // 幫資料做整理 (把字串轉回數字，過濾掉空的圖片網址)
    const productData = {
      data:{
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled:templateProduct.is_enabled ? 1 : 0,
        imagesUrl:[...templateProduct.imagesUrl.filter(url => url !== "")],
      },
    };

    try {
      const response = await axios[method](url, productData);  
        console.log(response.data);
        getProducts(); // 存檔成功後，重新拿一次最新的清單
        closeModal(); // 關閉彈出視窗
    } catch (error) {
        alert("失敗");
    }
  }

  // 刪除產品
  const delProduct = async (id) => {
    try {
       const response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`)
       console.log(response.data);
       getProducts(); // 刪除成功後，重新拿一次最新的清單
       closeModal(); // 關閉彈出視窗
    } catch (error) {
       alert("失敗");
    }
  };

  // 點擊「登入按鈕」時觸發的動作
  const onSubmit = async (e) => {
    e.preventDefault(); // 阻止表單預設的重新整理
    try {
      // 把帳號密碼送去驗證
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      const {token, expired} = response.data;

      // 把拿到的通行證 (Token) 存進瀏覽器的 Cookie (口袋) 裡
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      // 告訴 axios：以後每次出門都要帶這張通行證！
      axios.defaults.headers.common['Authorization'] = token;

      // 載入產品資料
      getProducts();

      // 更新狀態為「已登入」
      setIsAuth(true);
      alert("登入成功！");
      
    } catch (error) {
      setIsAuth(false);
      alert("登入失敗：" + (error.response?.data?.message || "請檢查帳密"));
    }
  }


  // ==========================================
  // 【第四步：生命週期】
  // ==========================================
  useEffect(() => {
    // 1. 翻找口袋 (Cookie)，看看有沒有之前存的通行證 (hexToken)
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];
      if(token){
        // 如果有，就交給 axios
        axios.defaults.headers.common['Authorization'] = token;
      }
    // 2. 把魔法指揮棒綁定到畫面上的 Modal 元素上
    productModalRef.current = new bootstrap.Modal("#productModal",{
      keyboard:false, // 設定不能按 ESC 關閉
    });

    // 3. 檢查通行證有沒有過期
    checkLogin();

  }, []); // 空陣列代表「只在畫面第一次載入時執行一次」

  // 打開彈出視窗
  const openModal = (type, product) => {
      setModalType(type); // 記住這次是為了什麼打開 (新增? 編輯? 刪除?)
      setTemplateProduct((pre) => ({
        ...pre,
        ...product, // 把要編輯/刪除的產品資料塞進去 (如果是新增，就會塞入空白卡片)
      }));
      productModalRef.current.show(); // 揮動指揮棒：打開！
  };

  // 關閉彈出視窗
  const closeModal = () => {
    productModalRef.current.hide(); // 揮動指揮棒：關閉！
  };

  // ==========================================
  // 【第五步：畫面上真正呈現的東西 (JSX)】
  // ==========================================
  return (
    <>
    {/* 如果 !isAuth (沒登入) -> 就顯示登入表單 */}
    {!isAuth ? (   
    <div className="container login">
      <h1>請先登入</h1>
      <form className="form-floating" onSubmit={onSubmit}>
        <div className="form-floating mb-3">
            <input type="email" 
                   className="form-control" 
                   name="username" 
                   placeholder="name@example.com" 
                   value={formData.username} 
                   onChange={handleInputChange}/>
            <label htmlFor="username">Email address</label>
          </div>
          <div className="form-floating">
            <input type="password" name="password" className="form-control" id="password" placeholder="Password" value={formData.password} onChange={handleInputChange}/>
            <label htmlFor="password">Password</label>
          </div>
          <button type='submit' className="btn btn-primary w-100 mt-2">
            登入
          </button>
      </form>
        // 如果已經登入，就顯示產品列表
    </div>) : (
        <div className='container'>
              <h2 className="">產品列表</h2>
              <div className="text-end mt-4">
                {/* 點擊就以 'create' 模式打開 Modal，並帶入空白卡片 */}
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
                  {/* 把所有產品一個一個抓出來變成表格的每一列 (tr) */}
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
        </div>
      )
    }

    {/* ========================================== */}
    {/* 隱藏的彈出視窗 (Modal) - 平常看不到，揮動指揮棒才會出來 */}
    {/* ========================================== */}
    <div className="modal fade" id="productModal" tabIndex="-1" aria-labelLedby="productModalLabel" aria-hidden="true" ref={productModalRef}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content border-0">
          {/* 標題列：如果是刪除就變紅色背景，不然就變深色 */}
          <div className={`modal-header bg-${modalType === 'delete' ? 'danger':'dark'} text-white`}>
            <h5 id="productModalLabel" className="modal-title">
              {/* 動態顯示標題文字 */}
              <span>{modalType === 'delete' ? '刪除' :
                modalType === 'edit' ? '編輯' : '新增'}產品</span>
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              ></button>
          </div>
          <div className="modal-body">
            {
              modalType === 'delete' ? (
                <p className="fs-4">
                  確定要刪除
                  <span className="text-danger">{templateProduct.title}</span>嗎？
                </p>
              ) : (
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          輸入圖片網址
                        </label>
                        <input
                          type="text"
                          id="imageUrl"
                          name="imageUrl"
                          className="form-control"
                          placeholder="請輸入圖片連結"
                          value={templateProduct.imageUrl}
                          onChange={(e) => handleModalInputChange(e)}
                          />
                      </div>
                      {
                        templateProduct.imageUrl && (
                          <img className="img-fluid" src={templateProduct.imageUrl} alt="主圖" />
                        )
                      }
                    </div>
                    <div>
                      {
                        templateProduct.imagesUrl.map((url, index) => (
                          <div key={index}>
                            <label htmlFor="imageUrl" className="form-label">
                              輸入圖片網址
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`圖片網址${index + 1}`}
                              value={url}
                              onChange={(e) => handleModalImageChange(index,e.target.value)}
                            />
                            {
                              url &&
                              <img
                                className="img-fluid"
                                src={url}
                                alt={`副圖${index + 1}`}
                              />
                            }
                          </div>
                        ))
                      }
                      {
                        templateProduct.imagesUrl.length < 5 && 
                        templateProduct.imagesUrl[templateProduct.imagesUrl.length - 1] !== "" &&
                        <button className="btn btn-outline-primary btn-sm d-block w-100"
                        onClick={() => handleAddImage()}>
                          新增圖片
                        </button>
                      }
                    </div>
                    <div>
                      {
                        templateProduct.imagesUrl.length >= 1 && 
                        <button className="btn btn-outline-danger btn-sm d-block w-100"
                        onClick={() => handleRemoveImage()}>
                          刪除圖片
                        </button>
                      }
                    </div>
                  </div>
                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">標題</label>
                      <input
                        name="title"
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={templateProduct.title}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">分類</label>
                        <input
                          name="category"
                          id="category"
                          type="text"
                          className="form-control"
                          placeholder="請輸入分類"
                          value={templateProduct.category}
                          onChange={(e) => handleModalInputChange(e)}
                          />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">單位</label>
                        <input
                          name="unit"
                          id="unit"
                          type="text"
                          className="form-control"
                          placeholder="請輸入單位"
                          value={templateProduct.unit}
                          onChange={(e) => handleModalInputChange(e)}
                          />
                      </div>
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">原價</label>
                        <input
                          name="origin_price"
                          id="origin_price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入原價"
                          value={templateProduct.origin_price}
                          onChange={(e) => handleModalInputChange(e)}
                          />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">售價</label>
                        <input
                          name="price"
                          id="price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入售價"
                          value={templateProduct.price}
                          onChange={(e) => handleModalInputChange(e)}
                          />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">產品描述</label>
                      <textarea
                        name="description"
                        id="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={templateProduct.description}
                        onChange={(e) => handleModalInputChange(e)}
                        ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">說明內容</label>
                      <textarea
                        name="content"
                        id="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={templateProduct.content}
                        onChange={(e) => handleModalInputChange(e)}
                        ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          name="is_enabled"
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={templateProduct.is_enabled}
                          onChange={(e) => handleModalInputChange(e)}
                          />
                        <label className="form-check-label" htmlFor="is_enabled">
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          </div>
          <div className="modal-footer">
            {
              modalType === 'delete' ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProduct(templateProduct.id)}>
                  刪除
                </button>
              ) : (
                <>                
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    onClick={() => closeModal()}
                    >
                    取消
                  </button>
                  <button type="button" className="btn btn-primary"
                    onClick={() => updateProduct(templateProduct.id)}
                    >
                    確認
                  </button>
                </>
              )
            }
          </div>
        </div>
      </div>
    </div>



    </>


  );
}

export default App
