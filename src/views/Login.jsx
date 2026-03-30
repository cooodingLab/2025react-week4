// 應用的入口。
// 它的核心邏輯是將 API 回傳的 token 存入 cookie，並設定為 Axios 的預設標頭，確保後續請求合法。
import { useState } from 'react';
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function Login({ getProducts, setIsAuth }) {
    const [formData, setFormData] = useState({
        username:"",
        password:"",
    });

    const handleInputChange = (e) => {
        const {name, value} = e.target
            setFormData((preData) => ({
            ...preData,
            [name]:value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault(); 
        try {
            const response = await axios.post(`${API_BASE}/admin/signin`, formData);
            const {token, expired} = response.data;
            // 1. 將 token 存入 cookie，設定過期時間
            document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
            // 2. 核心：將 token 直接寫入 axios 預設標頭，之後所有的請求都不用再手動傳 token
            axios.defaults.headers.common['Authorization'] = token;
            // 3. 執行父元件傳來的函式：更新產品清單並切換登入狀態
            getProducts();
            setIsAuth(true);
            alert("登入成功！");
        
        } catch (error) {
            setIsAuth(false);
            alert("登入失敗：" + (error.response?.data?.message || "請檢查帳密"));
        }
    }

    return(
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
        </div>
    )
}

export default Login;