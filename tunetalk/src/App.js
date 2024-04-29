import "./css/App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Menu } from "./pages/Menu";
import { Home } from './pages/Home';
import { Feed } from './pages/Feed';
import { Community } from './pages/Community';
import { Account } from './pages/Account';
import { Login } from "./pages/Login";
import { UserProvider } from "./UserState";
import { useEffect } from "react";

function App() {
  // const [data, setData] = useState("Hello World");
  //   useEffect(() => {
      
  //   }, [])
    return (
      <div className="App">
        <UserProvider>
          <Navbar/> 
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/home" element={<Home />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/community" element={<Community />} />
              <Route path="/account" element={<Account />} />
              <Route path="/login" element={<Login />} />
            </Routes>
        </UserProvider>
      </div>
    );
}

export default App;