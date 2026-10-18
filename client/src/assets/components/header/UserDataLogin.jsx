
const UserDataLogin = ({imgUser, nameUser}) =>{
    return(
        <div className="flex items-center justify-start gap-3">
        <img src={imgUser} alt="" 
        className="w-[65px] h-[65px] sm:w-[80px] sm:h-[80px] rounded-full bg-cover bg-center"/>
        <div>
          <h1 className="sm:text-xl font-semibold text-red-900">{nameUser}</h1>
          <h1 className="text-sm sm:text-lg font-semibold">Liberte a tua essência</h1>
        </div>
        </div>
    )
}

export default UserDataLogin;