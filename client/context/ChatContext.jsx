// import { useContext, useEffect } from "react";
// import { createContext, useState } from "react";
// import { AuthContext } from "./AuthContext";
// import toast from "react-hot-toast";


// export const ChatContext = createContext();


// export const ChatProvider =({children})=>{

//     const [messages,setMessages]=useState([]);
//     const [users,setUsers]=useState([]);
//     const [selectedUser,setSelectedUser]=useState(null);
//     const [unseenMessages,setUnseenMessages]=useState({});

//     const {socket,axios}=useContext(AuthContext);

//     // function to get all users for sidebar

//     const getUsers = async ()=>{
//         try{
//          const { data } =await axios.get("/api/messages/users");
//          if(data.success){
//             setUsers(data.users)
//             setUnseenMessages(data.unseenMessages)
//          }

//         }catch(error){
//           toast.error(error.message);
//         }
//     }
//     // function to get messages for selected user
//     const getMessages = async (userId)=>{
//       try{
//         const { data }= await axios.get(`/api/messages/${userId}`);
//         if(data.success){
//             setMessages(data.messages);
//         }
//       }catch(error){
//         toast.error(error.message);
//       }
//     }
    

//    // function to send message to selected user
//    const sendMessage= async (messageData)=>{
//     try{
//        const {data}=await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
//        if(data.success){
//          setMessages((prevMessages)=>[...prevMessages,data.newMessage])
//        }else{
//         toast.error(data.message);
//        }
//     }catch(error){
//       toast.error(data.message);
//     }
//    }

//    // function to subscribe to messages for selected user

//      const subscribeToMessages= async ()=>{
//        if(!socket){
//         return;
//        }
//        socket.on("newMessage",(newMessage)=>{
//              if(selectedUser && newMessage.senderId===selectedUser._id){
//                 newMessage.seen=true;
//                 setMessages((prevMessages)=>[...prevMessages,newMessage]);
//                 axios.put(`/api/messages/mark/${newMessage._id}`);

//              }else{
//                 setUnseenMessages((prevUnseenMessages)=>({
//                    ...prevUnseenMessages,[newMessage.senderId] : prevUnseenMessages[newMessage.senderId]?prevUnseenMessages[newMessage.senderId]+1:1
//                 }))
//              }
//        })

//      }

//     // function to unsubscribe
//      const unsubscribeFromMessages=()=>{
//         if(socket) socket.off("newMessage");
//      }
     
// useEffect(()=>{
//    subscribeToMessages();
//    return ()=>unsubscribeFromMessages();
// },[socket,selectedUser])

//     const value={
//       messages,users,selectedUser,getUsers,getMessages,sendMessage,setSelectedUser,unseenMessages,setUnseenMessages
//     }
//     return (
//     <ChatContext.Provider value={value}>
//      {children}
//     </ChatContext.Provider>
//     )

// } 





import { useContext, useEffect } from "react";
import { createContext, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, _setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [messagesMap, setMessagesMap] = useState({});

  const { socket, axios } = useContext(AuthContext);

  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const setSelectedUser = async (user) => {
    _setSelectedUser(user);
    if (!user) return;

    try {
      const { data } = await axios.get(`/api/messages/${user._id}`);
      if (data.success) {
        const unseenCount = unseenMessages[user._id] || 0;
        const unseenLiveMessages = unseenCount ? messagesMap[user._id] || [] : [];

        unseenLiveMessages.forEach((msg) => {
          msg.seen = true;
          axios.put(`/api/messages/mark/${msg._id}`);
        });

        setUnseenMessages((prev) => {
          const updated = { ...prev };
          delete updated[user._id];
          return updated;
        });

        const mergedMessages = [...data.messages, ...unseenLiveMessages];
        mergedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setMessages(mergedMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setMessagesMap((prev) => {
          const updated = { ...prev };
          if (!updated[newMessage.senderId]) updated[newMessage.senderId] = [];
          updated[newMessage.senderId].push(newMessage);
          return updated;
        });
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });
  };

  const unsubscribeFromMessages = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser]);

  const value = {
  messages,
  users,
  selectedUser,
  getUsers, 
  sendMessage,
  setSelectedUser,
  unseenMessages,
  setUnseenMessages,
};

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
