import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import SignIn from "./components/SignIn";
import Main from "./components/Main";
import TakeNewUserInfo from "./components/TakeNewUserInfo";
import Room from "./components/Room";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/main" element={<Main />} />
        <Route path="/newuserinfo" element={<TakeNewUserInfo />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;
