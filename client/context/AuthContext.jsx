// import { createContext, useEffect, useState } from "react";
// import axios from 'axios';
// import toast from "react-hot-toast";
// import {io} from "socket.io-client";

// const backendurl=import.meta.env.VITE_BACKEND_URL;
// axios.defaults.baseURL=backendurl;
// export const AuthContext = createContext();

// export const AuthProvider = ({children}) =>{

//    const [token,setToken]=useState(localStorage.getItem("token"));
//    const [authUser,setAuthUser]=useState(null);
//    const [OnlineUsers,setOnlineUsers]=useState([]);
//    const [socket,setSocket]=useState(null);

//     const checkAuth=async ()=>{
//         try{
//         const { data } = await axios.get("/api/auth/check");
//         if(data.success){
//             setAuthUser(data.user)
//             connectSocket(data.user)
//         }
//         }catch(error){
//           toast.error(error.message)
//         }
//     }

//      const login = async (state,credentials)=>{
//           try{
//            const { data }= await axios.post(`/api/auth/${state}`,credentials);
//            if(data.success){
//             setAuthUser(data.userData);
//             connectSocket(data.userData);
//             axios.defaults.headers.common["token"]=data.token;
//             setToken(data.token);
//             localStorage.setItem("token",data.token);
//             toast.success(data.message)
//            }
//            else{
//             toast.error(data.message)
//            }
//           }catch(error){
//              toast.error(error.message)
//           }
//      }


// const logout = async ()=>{
//     localStorage.removeItem("token")
//     setToken(null);
//     setAuthUser(null);
//     setOnlineUsers([]);
//     axios.defaults.headers.common["token"]=null;
//     toast.success("Logged Out Successfully")
//     socket.disconnect();
// }


// // update profile function
// const updateProfile = async (body)=>{
//      try{
//       const { data } = await axios.put("/api/auth/update-profile", body);
//       if(data.success){
//         setAuthUser(data.user);
//         toast.success("profile updated successfully")
//       }
//      }catch(error){
//        toast.error(error.message)
//      }
// }

//      const connectSocket=(userData)=>{
//         if(!userData || socket?.connected) return;
//         const newSocket= io(backendurl,{
//             query:{
//                 userId:userData._id,

//             }
//         });
//         newSocket.connect();
//         setSocket(newSocket);
//         newSocket.on("getOnlineUsers",(userIds)=>{
//             setOnlineUsers(userIds);
//         })
//      }
//      useEffect(()=>{
//       if(token){
//         axios.defaults.headers.common["token"]=token;
//       }
//       checkAuth();
//      },[])

//     const value={
//         axios,
//         authUser,
//         OnlineUsers,
//         socket,
//         login,
//         logout,
//         updateProfile
//     }
//     return (
//         <AuthContext.Provider value={value}>
//             {children}
//         </AuthContext.Provider>
//     )
// }





import { createContext, useEffect, useState } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendurl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendurl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    if (socket) socket.disconnect();
    toast.success("Logged Out Successfully");
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendurl, {
      query: {
        userId: userData._id,
      },
    });

    newSocket.on("connect", () => {
      newSocket.emit("addUser", userData._id); // ✅ emit after connect
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });

    newSocket.on("disconnect", () => {
      setOnlineUsers([]);
    });

    setSocket(newSocket);
  };

  // Auto re-auth and reconnect on page load
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    }
  }, []);

  // Optional: reconnect socket on tab focus (if disconnected)
  useEffect(() => {
    const handleFocus = () => {
      if (authUser && (!socket || !socket.connected)) {
        connectSocket(authUser);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [authUser, socket]);

  const value = {
    axios,
    authUser,
    onlineUsers,      
    socket,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
