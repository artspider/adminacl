import "./main.css";
import 'alpinejs';
import Cookies from 'js-cookie'
// import XLSX from 'xlsx';

// console.log(window);

Spruce.store(
    'status', {
        pantalla: '',
        sat_count:0,
        peps_count:0,        
        onu_count:0,
        sat_last: '',
        peps_last: '',
        onu_last: '',
    }
);

function loginComp(){
    return {
        mytoken: null,
        loged:false,
        email: null,
        password: null,
        errorEmail: null,
        errorPassword: null,
        loadingLogin: false,        
        initApp: async function () {
            let cookieKey = Cookies.get('token');
            // console.log(cookieKey);

            if (!cookieKey) {
                this.loged = false;
                this.$store.status.pantalla = 'login';
            } else{
                this.loged = true;
                this.$store.status.pantalla = 'home';
                let url_countlist = "http://apiacl.r2ro.site/api/countlist";
                await fetch(url_countlist, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + cookieKey
                    },
                    cache: 'no-cache',
                 })
                 .then(function (response) {
                         console.log(response);
                         if (response.status == 200) {
                             console.log('Datos leidos');
                             console.log(response);
                         } else {
                             swal({
                                 text: "No se pudieron leer los datos",
                                 icon: "error",
                             });

                         }
                         return response.json();
                     })
                .then(data => {
                    console.log(data);
                    this.$store.status.peps_count = data.pepslist;
                    this.$store.status.sat_count = data.satlist;
                    this.$store.status.onu_count = data.lpbonulist;
                    this.$store.status.peps_last = data.pepslist_last.nombre;
                    this.$store.status.sat_last = data.satlist_last.nombre;
                    this.$store.status.onu_last = data.lpbonulist_last.nombre;
                });
            }

            // console.log(this.$store.status.pantalla);
        },
        status: function() {
            return this.$store.status.pantalla;
        },
        prueba: function() {
            console.log('por suerte...');
        },
        onClick: function() {

            this.loadingLogin = true;
            
            this.errorEmail = null;
            this.errorPassword = null;

            //let url = "http://192.168.1.77/farid/public/api/login";
            let url = "http://apiacl.r2ro.site/api/login";
            var vEmail = this.validateEmail(this.email);
            var vPassword = true;
            if(this.password == null){
                vPassword = false;
            }else {
                if(this.password.length < 5) {
                    vPassword = false;
                }
            }           
            
            if(vEmail == false ){
                this.errorEmail = "Correo no válido";
            }

            if(vPassword == false ){
                this.errorPassword = "Contraseña no válida";
            }

            if(vEmail == false || vPassword == false){
                return;
            }

            this.errorEmail = null;
            this.errorPassword = null;
            
            fetch(url,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'                    
                },
                body: JSON.stringify({
                    "email" : this.email,
                    "password" : this.password
                }),
                cache: 'no-cache',
            })
            .then(function(response) {
                if(response.status == 200){
                    // console.log('se logueo satisfactoriamente');
                }else{
                    swal({                       
                        text: "Usuario o contraseña incorrectos",
                        icon: "error",
                    });
                    this.loadingLogin = false;
                    // console.log('No se logro ingresar');
                }
                               
                return response.json();
            })
            .then(data => {
                this.mytoken = data;
                if(this.mytoken.access_token){
                    this.loged=true;
                    this.$store.status.pantalla = 'home'; 
                    
                    let minutes = (this.mytoken.expires_in / 60) - 2;
                    var expireTime = new Date(new Date().getTime() + minutes * 60 * 1000);
                    Cookies.set('token', this.mytoken.access_token, { expires: expireTime });
                }
                this.loadingLogin = false;
            })
            .catch(function(err) {
                // console.error(err);
                this.loadingLogin = false;
            });
        },
        onInputEmail: function(event) {
            this.email = event.target.value;
        },
        onInputPassword: function(event) {
            this.password = event.target.value;
        },
        validateEmail: function(_email) {
            const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(_email);
        },
        routeTo: function(_route) {
            this.$store.status.pantalla = _route; 
        },
        Logout: function() {
            let cookieKey = Cookies.get('token');

            if(cookieKey === undefined){
                this.removeToken();
            } else {
                let url = 'http://apiacl.r2ro.site/api/logout';

                //Fetch API
                fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + cookieKey
                    },
                    cache: 'no-cache',
                })
                .then(function(response) {
                    return response.json();
                })
                .then(data => {
                    if(data.response == 200) {
                        this.removeToken();
                    }
                })
                .catch(function(err) {
                    // console.error(err);
                });
            }           
        },
        removeToken: function(){
            // console.log('removeToken');
            Cookies.remove('token');
            this.loged = false;
            this.$store.status.pantalla = 'login';

            // Limpia los campos
            document.getElementById("email").value  = "";
            this.email = "";

            document.getElementById("password").value  = "";
            this.password = "";
        }
    }
}
window.loginComp = loginComp;

function uploadData(){
    return {
        loading: false,
        selectedFile: null,
        tipolista: 'pepslist',
        tipocarga: 'reemplazar',
        mensajeTipoCarga: 'Se reemplazara la base de datos por el contenido del excel.',
        mensajeTipoLista: 'Los campos para una lista PEPS son: NOMBRE, CARGO y FECHA DE NACIMIENTO',
        changeFile: async function(event)  {
            // console.log("evento: ", event.target.files);
            this.selectedFile = await event.target.files[0];
        },

        changetopeps: function() {
            this.tipolista = 'pepslist';
            this.mensajeTipoLista = 'Los campos para una lista PEPS son: NOMBRE, CARGO y FECHA DE NACIMIENTO';
        },
        
        changetosat: function() {
            this.tipolista = 'satlist';
            this.mensajeTipoLista = 'Los campos para una lista SAT son: NOMBRE, TIPO, NACIONALIDAD, PAIS, RFC, CAUSA y FECHA DE NACIMIENTO';
        },

        changetoonu: function() {
            this.tipolista = 'lpbonulist';
            this.mensajeTipoLista = 'Los campos para una lista ONU son: NOMBRE, ACTIVIDAD y FECHA DE NACIMIENTO';
        },
        changetipoCarga: function(_tipoCarga) {
            if(_tipoCarga === 'reemplazar') {
                this.tipocarga = 'reemplazar';
                this.mensajeTipoCarga = 'Se reemplazara la base de datos por el contenido del excel.'
            } else if(_tipoCarga === 'anadir'){
                this.tipocarga = 'anadir';
                this.mensajeTipoCarga = 'Se añadira a la base de datos el contenido del excel.'
            }
        },
        upload: function(event) {

            if(this.validarSesion()) {

                let url = 'http://apiacl.r2ro.site/api/' + this.tipolista + '/updatelist';
                let cookieKey = Cookies.get('token');
                
                if(this.selectedFile){

                    let ref = this;
                    this.loading = true;
                    
                    var data = new FormData();
                    data.append('file', this.selectedFile);
                    data.append('tipoCarga', this.tipocarga);

                    fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + cookieKey
                    },
                    body: data,
                    cache: 'no-cache'
                    }).then(function(response) {
                        if(response.status == 200){
                            ref.loading = false;
                            console.log("se subio");
                        }else{
                            ref.loading = false;
                            swal("", "Error al subir la lista. Revise que la lista seleccionada coincida con el archivo de excel cargado.", "error");
                        }                       
                        return response.json();
                    })
                    .then(data => {
                        console.log(data);
                        ref.loading = false;
                        if(data.status == "Lista creada"){
                            swal("", "Operación realizada correctamente", "success");
                            if(this.tipolista== "pepslist") {
                                this.$store.status.peps_count = data.records;
                                this.$store.status.peps_last = data.last.nombre;                    
                            }
                            if(this.tipolista== "satlist") {
                                this.$store.status.sat_count = data.records;
                                this.$store.status.sat_last = data.last.nombre;                           
                            }
                            if(this.tipolista== "lpbonulist") {
                                this.$store.status.onu_count = data.records;
                                this.$store.status.onu_last = data.last.nombre;
                            }
                            
                        }                       
                        else if(data.hasOwnProperty("Error en compatibilidad")){
                            swal("", "Error al subir la lista. Revise que la lista seleccionada coincida con el archivo de excel cargado.", "error");  
                        } else if(data.error === 'Unauthorized') {
                            swal("", "No tiene los permisos necesarios para realizar la acción", "error"); 
                        }                                     
                    })
                    .catch(function(err) {
                        ref.loading = false;
                        // console.error('error: ', err);
                    });                

                }else{
                    swal("", "Ningún archivo seleccionado", "warning");
                }
            }
        },
        validarSesion: function() {
            let cookieKey = Cookies.get('token');
            // console.log('cookie', cookieKey);

            if(cookieKey == undefined) {
                Cookies.remove('token');
                this.loged = false;
                this.$store.status.pantalla = 'login';
    
                // Limpia los campos de login
                document.getElementById("email").value  = "";
                document.getElementById("password").value  = "";   
                
                swal("", "Su sesión caduco. Por favor inicie sesión nuevamente", "warning");
                return false;
            } else{
                return true;
            }
        }        
    }
}
window.uploadData = uploadData;

function createUser(){
    return {
        nombre: null,
        email: null,
        password: null,
        confirmPassword: null,
        typeUser: 2,
        errorNombre: null,
        errorEmail: null,
        errorPassword: null,
        errorConfirmPassword: null,
        onInputUserName: function(event) {
            this.nombre = event.target.value;
            this.validateName(this.nombre);
        },
        validateName: function(_name) {
            let vName = true;
            
            if(_name == null || _name.length < 3){
                vName = false;
            }

            if(!vName) {
                this.errorNombre = "Ingrese un nombre valido (Min 3 caracteres)";
            }else{
                this.errorNombre = "";
            }

            return vName;     
        },
        onInputUserEmail: function(event) {
            this.email = event.target.value;
            if(!this.validateEmail(this.email)){
                this.errorEmail = "Correo no válido";
            }else{
                this.errorEmail = "";
            }
        },
        validateEmail: function(_email) {
            const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            
            let vEmail = re.test(_email);

            if(!vEmail) {
                this.errorEmail = "Correo no válido";
            } else{
                this.errorEmail = "";
            }

            return vEmail;
        },
        onInputUserPassword: function(event) {
            this.password = event.target.value;
            this.validatePassword(this.password);
            if(this.confirmPassword != null){
                this.validateConfirmPassword(this.password, this.confirmPassword);
            }
        },
        validatePassword: function(_password) {
            let vPassword = true;
            
            if(_password == null || _password.length < 5){
                vPassword = false;
            }

            if(!vPassword) {
                this.errorPassword = "Contraseña no válida (Min 5 caracteres)";
            }else{
                this.errorPassword = "";
            }

            return vPassword;     
        },
        onInputUserConfirmPassword: function(event) {
            this.confirmPassword = event.target.value;
            this.validateConfirmPassword(this.password, this.confirmPassword);
        },
        validateConfirmPassword: function(_password, _confirmPassword) {
            let vConfirmPassword = _password === _confirmPassword;

            if(!vConfirmPassword){
                this.errorConfirmPassword = "Las contraseñas no coinciden";
            } else{
                this.errorConfirmPassword = "";
            }

            return vConfirmPassword;
        },
        changetypeuser: function(_type) {
            if(_type === 'editor'){
                this.typeUser = 2;
            } else if(_type === 'visor'){
                this.typeUser = 3;
            }
        },
        create: function() {

            if(this.validarSesion()) {
                let cookieKey = Cookies.get('token');

                let url = 'http://apiacl.r2ro.site/api/register';

                var vName = this.validateName(this.nombre);
                var vEmail = this.validateEmail(this.email);              
                var vPassword = this.validatePassword(this.password);            
                var vConfirmPassword = this.validateConfirmPassword(this.password, this.confirmPassword);

                if(vName && vEmail && vPassword && vConfirmPassword) {
                    fetch(url,{
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + cookieKey                 
                        },
                        body: JSON.stringify({
                            "name" : this.nombre,
                            "email" : this.email,
                            "password" : this.password,
                            "password_confirmation": this.confirmPassword,
                            "type" : this.typeUser
                        }),
                        cache: 'no-cache',
                    })
                    .then(function(response) {
                        // console.log(response);
                        if(response.status == 200){                       
                        }                                
                        return response.json();
                    })
                    .then(data => {
                        // console.log(data);
                        if(data.status === 'success'){
                            swal("", "Se ingreso el usuario satisfactoriamente", "success");

                            // Limpia los campos 

                            document.getElementById("userName").value  = "";
                            this.nombre = "";

                            document.getElementById('userEmail').value = "";
                            this.email = "";

                            document.getElementById('userPassword').value = "";
                            this.password = "";

                            document.getElementById('userConfirmPassword').value = "";
                            this.password_confirmation = "";

                            document.getElementById('editor').checked = true;
                            this.typeUser = 2;

                        } else if(data.email && data.email[0].includes("taken")){
                            swal("", "El email ya se encuentra registrado", "error");  
                        } else if(data.error === 'Unauthorized') {
                            swal("", "No tiene los permisos necesarios para realizar la acción", "error"); 
                        }
                    })
                    .catch(function(err) {
                        console.error(err);
                    });
                } else {
                    swal("", "Verifique los datos ingresados", "warning");
                }
            }
        },
        validarSesion: function() {
            let cookieKey = Cookies.get('token');
            // console.log('cookie', cookieKey);

            if(cookieKey == undefined) {
                Cookies.remove('token');
                this.loged = false;
                this.$store.status.pantalla = 'login';
    
                // Limpia los campos de login
                document.getElementById("email").value  = "";
                document.getElementById("password").value  = "";   
                
                swal("", "Su sesión caduco. Por favor inicie sesión nuevamente", "warning");
                return false;
            } else{
                return true;
            }
        }
    }
}
window.createUser = createUser;

function listUsers(){
    return {
        loading: false,
        open: false,
        idEdit: null,
        data: null,
        editPassword: null,
        editConfirmPassword: null,
        errorEditPassword: null,
        errorEditConfirmPassword: null,
        onInputEditUserPassword:function(event){
            this.editPassword = event.target.value;
            this.validatePassword(this.editPassword);
            if(this.editConfirmPassword != null){
                this.validateConfirmPassword(this.editPassword, this.editConfirmPassword);
            }
        },
        validatePassword: function(_password) {
            let vPassword = true;
            
            if(_password == null || _password.length < 5){
                vPassword = false;
            }

            if(!vPassword) {
                this.errorEditPassword = "Contraseña no válida (Min 5 caracteres)";
            }else{
                this.errorEditPassword = "";
            }

            return vPassword;     
        },
        onInputEditUserConfirmPassword: function(event){
            this.editConfirmPassword = event.target.value;
            this.validateConfirmPassword(this.editPassword, this.editConfirmPassword);
        },
        validateConfirmPassword: function(_password, _confirmPassword) {
            let vConfirmPassword = _password === _confirmPassword;

            if(!vConfirmPassword){
                this.errorEditConfirmPassword = "Las contraseñas no coinciden";
            } else{
                this.errorEditConfirmPassword = "";
            }

            return vConfirmPassword;
        },
        listarUsuarios: function() {
            if(this.validarSesion()) {
                let cookieKey = Cookies.get('token');

                let url = 'http://apiacl.r2ro.site/api/users';

                let ref = this;

                    // Fetch API
                    fetch(url,{
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + cookieKey
                        },
                        cache: 'no-cache',
                    })
                    .then(function(response) {
                        return response.json();
                    })
                    .then(data => { 
                        ref.data = data;                  
                        // console.log('Cantidad de registros:  ', data.length);
                        
                        // Extract value from table header.                
                        var col = [];
                        for (var i = 0; i < data.length; i++) {
                            for (var key in data[i]) {
                                if (col.indexOf(key) === -1) {
                                    col.push(key);
                                }
                            }
                        }

                        // Create a table.
                        var table = document.createElement("table");
                        table.classList.add("mx-auto", "bg-white");

                        // Create table header row using the extracted headers above.
                        var tr = table.insertRow(-1);                   // table row.

                        for (var i = 0; i < col.length; i++) {
                            var th = document.createElement("th");      // table header.
                            th.innerHTML = col[i];
                            tr.appendChild(th);
                            th.classList.add("redACL", "text-center", "px-8", "py-4");
                        }

                        // add json data to the table as rows.
                        for (var i = 0; i < data.length; i++) {
                            tr = table.insertRow(-1);

                            for (var j = 0; j < col.length; j++) {
                                var tabCell = tr.insertCell(-1);
                                tabCell.innerHTML = data[i][col[j]];
                                tabCell.classList.add("px-8", "py-4");
                            }
                            var tabCell = tr.insertCell(-1);
                            var id  = data[i][col[0]];
                            // tabCell.innerHTML = "<div id='" + id + "' class='bg-blue-900 rounded-full h-12 w-12 my-2 flex justify-center items-center cursor-pointer'> <svg id='" + id + "' class='w-6 h-6' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'> <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' /></svg> </div>";
                            tabCell.innerHTML = "<div id='" + id + "' class='bg-blue-900 text-white rounded my-2 p-2 flex justify-center items-center cursor-pointer'> Editar Password</div>";
                            tabCell.classList.add("px-8", "py-4");
                            tabCell.onclick = function (event) {
                                let _id = parseInt(event.path[0].id);
                                if(!isNaN(_id)){
                                    // console.log(_id);
                                    ref.abrirModal(_id); 
                                }                                    
                            };                            
                        }

                        if(data.length == 0) {
                            table.innerHTML = "<h3> No se encontraron coincidencias </h3>";
                            table.classList.add("font-bold", "text-lg");
                        }

                        // Now, add the newly created table with json data, to a container.
                        var divShowData = document.getElementById('showData');
                        divShowData.innerHTML = "";
                        divShowData.appendChild(table);
                    })
                    .catch(function(err) {
                        console.error(err);
                    });
            }
        },
        abrirModal: function(id) {
            document.getElementById("editUserPassword").value  = "";
            document.getElementById("editUserConfirmPassword").value  = "";   

            this.open = true;
            this.idEdit = id;
        },
        aceptarCambios:  function() {            
            var vPassword = this.validatePassword(this.editPassword);            
            var vConfirmPassword = this.validateConfirmPassword(this.editPassword, this.editConfirmPassword);

            if(vPassword && vConfirmPassword){

                if(this.validarSesion()) {
                    let cookieKey = Cookies.get('token');

                    let url = 'http://apiacl.r2ro.site/api/userupdate';                
                    
                    // Fetch API
                    fetch(url,{
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + cookieKey
                        },
                        body: JSON.stringify({
                            "id": this.idEdit,
                            "password" : this.editPassword
                        }),
                        cache: 'no-cache',
                    })
                    .then(function(response) {
                        return response.json();
                    })
                    .then(data => {
                        this.open = false;
                        if(data.status == "success"){
                            swal("", "Datos actualizados corretamente", "success");
                        } else if(data.status === 'error') {
                            swal("", "No fue posible actualizar los datos", "error");  
                        } else if(data.error === 'Unauthorized') {
                            swal("", "No tiene los permisos necesarios para realizar la acción", "error"); 
                        }
                    })
                    .catch(function(err) {
                        console.error(err);
                    });
                }
            } else {
                swal("", "Verifique los datos ingresados", "warning");
            }
        },
        cancelModal: function() {
            this.open = false;
        },
        validarSesion: function() {
            let cookieKey = Cookies.get('token');
            // console.log('cookie', cookieKey);

            if(cookieKey == undefined) {
                Cookies.remove('token');
                this.loged = false;
                this.$store.status.pantalla = 'login';
    
                // Limpia los campos de login
                document.getElementById("email").value  = "";
                document.getElementById("password").value  = "";   
                
                swal("", "Su sesión caduco. Por favor inicie sesión nuevamente", "warning");
                return false;
            } else{
                return true;
            }
        }
    }
}
window.listUsers = listUsers;