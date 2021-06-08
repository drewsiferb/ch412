
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
$(document).ready(function(){
 
// Запускаем метод init, когда документ будет готов:
chat.init();
 
});
 
var chat = {
 
// data содержит переменные для использования в классах:
 
data : {
lastID : 0,
noActivity : 0
},
 
// Init привязывает обработчики событий и устанавливает таймеры:
 
init : function(){
 
// Используем плагин jQuery defaultText, включенный внизу:
$('#name').defaultText('Псевдоним');
$('#email').defaultText('Email (используется Gravatar)');

// Конвертируем div #chatLineHolder в jScrollPane,
// сохраняем API плагина в chat.data:
 
chat.data.jspAPI = $('#chatLineHolder').jScrollPane({
verticalDragMinHeight: 12,
verticalDragMaxHeight: 12
}).data('jsp');
 
// Используем переменную working для предотвращения
// множественных отправок формы:
 
var working = false;
 
// Регистрируем персону в чате:
 
$('#loginForm').submit(function(){
 
if(working) return false;
working = true;
 
// Используем нашу функцию tzPOST
// (определяется внизу):
 
$.tzPOST('login',$(this).serialize(),function(r){
working = false;
 
if(r.error){
chat.displayError(r.error);
}
else chat.login(r.name,r.gravatar);
});
 
return false;
});
// Отправляем данные новой строки чата:
 
$('#submitForm').submit(function(){
 
    var text = $('#chatText').val();
     
    if(text.length == 0){
    return false;
    }
     
    if(working) return false;
    working = true;
     
    // Генерируем временный ID для чата:
    var tempID = 't'+Math.round(Math.random()*1000000),
    params = {
    id : tempID,
    author : chat.data.name,
    gravatar : chat.data.gravatar,
    text : text.replace(/</g,'&lt;').replace(/>/g,'&gt;')
    };
     
    // Используем метод addChatLine, чтобы добавить чат на экран
    // немедленно, не ожидая завершения запроса AJAX:
     
    chat.addChatLine($.extend({},params));
     
    // Используем метод tzPOST, чтобы отправить чат
    // через запрос POST AJAX:
     
    $.tzPOST('submitChat',$(this).serialize(),function(r){
    working = false;
     
    $('#chatText').val('');
    $('div.chat-'+tempID).remove();
     
    params['id'] = r.insertID;
    chat.addChatLine($.extend({},params));
    });
     
    return false;
    });
     
    // Отключаем пользователя:
     
    $('a.logoutButton').live('click',function(){
     
    $('#chatTopBar > span').fadeOut(function(){
    $(this).remove();
    });
     
    $('#submitForm').fadeOut(function(){
    $('#loginForm').fadeIn();
    });
     
    $.tzPOST('logout');
     
    return false;
    });
     
    // Проверяем состояние подключения пользователя (обновление браузера)
     
    $.tzGET('checkLogged',function(r){
    if(r.logged){
    chat.login(r.loggedAs.name,r.loggedAs.gravatar);
    }
    });
     
    // Самовыполняющиеся функции таймаута
     
    (function getChatsTimeoutFunction(){
    chat.getChats(getChatsTimeoutFunction);
    })();
     
    (function getUsersTimeoutFunction(){
    chat.getUsers(getUsersTimeoutFunction);
    })();
     
    },
    // Метод login скрывает данные регистрации пользователя
// и выводит форму ввода сообщения
 
login : function(name,gravatar){
 
    chat.data.name = name;
    chat.data.gravatar = gravatar;
    $('#chatTopBar').html(chat.render('loginTopBar',chat.data));
     
    $('#loginForm').fadeOut(function(){
    $('#submitForm').fadeIn();
    $('#chatText').focus();
    });
     
    },
     
    // Метод render генерирует разметку HTML,
    // которая нужна для других методов:
     
    render : function(template,params){
     
    var arr = [];
    switch(template){
    case 'loginTopBar':
    arr = [
    '<span><img src="',params.gravatar,'" width="23" height="23" />',
    '<span>',params.name,
    '</span><a href="">Выйти</a></span>'];
    break;
     
    case 'chatLine':
    arr = [
    '<div><span><img src="',params.gravatar,
    '" width="23" height="23" onload="this.style.visibility=\'visible\'" />','</span><span>',params.author,
    ':</span><span>',params.text,'</span><span>',params.time,'</span></div>'];
    break;
     
    case 'user':
    arr = [
    '<div title="',params.name,'"><img src="',
    params.gravatar,'" width="30" height="30" onload="this.style.visibility=\'visible\'" /></div>'
    ];
    break;
    }
     
    // Единственный метод join для массива выполняется
    // быстрее, чем множественные слияния строк
     
    return arr.join('');
     
    },
    // Метод addChatLine добавляет строку чата на страницу
 
addChatLine : function(params){
 
    // Все показания времени выводятся в формате временного пояса пользователя
     
    var d = new Date();
    if(params.time) {
     
    // PHP возвращает время в формате UTC (GMT). Мы используем его для формирования объекта date
    // и дальнейшего вывода в формате временного пояса пользователя.
    // JavaScript конвертирует его для нас.
     
    d.setUTCHours(params.time.hours,params.time.minutes);
    }
     
    params.time = (d.getHours() < 10 ? '0' : '' ) + d.getHours()+':'+
    (d.getMinutes() < 10 ? '0':'') + d.getMinutes();
     
    var markup = chat.render('chatLine',params),
    exists = $('#chatLineHolder .chat-'+params.id);
     
    if(exists.length){
    exists.remove();
    }
     
    if(!chat.data.lastID){
    // Если это первая запись в чате, удаляем
    // параграф с сообщением о том, что еще ничего не написано:
     
    $('#chatLineHolder p').remove();
    }
     
    // Если это не временная строка чата:
    if(params.id.toString().charAt(0) != 't'){
    var previous = $('#chatLineHolder .chat-'+(+params.id - 1));
    if(previous.length){
    previous.after(markup);
    }
    else chat.data.jspAPI.getContentPane().append(markup);
    }
    else chat.data.jspAPI.getContentPane().append(markup);
     
    // Так как мы добавили новый контент, нужно
    // снова инициализировать плагин jScrollPane:
     
    chat.data.jspAPI.reinitialise();
    chat.data.jspAPI.scrollToBottom(true);
     
    },
    // Данный метод запрашивает последнюю запись в чате
// (начиная с lastID), и добавляет ее на страницу.
 
getChats : function(callback){
    $.tzGET('getChats',{lastID: chat.data.lastID},function(r){
     
    for(var i=0;i<r.chats.length;i++){
    chat.addChatLine(r.chats[i]);
    }
     
    if(r.chats.length){
    chat.data.noActivity = 0;
    chat.data.lastID = r.chats[i-1].id;
    }
    else{
    // Если нет записей в чате, увеличиваем
    // счетчик noActivity.
     
    chat.data.noActivity++;
    }
     
    if(!chat.data.lastID){
    chat.data.jspAPI.getContentPane().html('<p>Ничего еще не написано</p>');
    }
     
    // Устанавливаем таймаут для следующего запроса
    // в зависимости активности чата:
     
    var nextRequest = 1000;
     
    // 2 секунды
    if(chat.data.noActivity > 3){
    nextRequest = 2000;
    }
     
    if(chat.data.noActivity > 10){
    nextRequest = 5000;
    }
     
    // 15 секунд
    if(chat.data.noActivity > 20){
    nextRequest = 15000;
    }
     
    setTimeout(callback,nextRequest);
    });
    },
     
    // Запрос списка всех пользователей.
     
    getUsers : function(callback){
    $.tzGET('getUsers',function(r){
     
    var users = [];
     
    for(var i=0; i< r.users.length;i++){
    if(r.users[i]){
    users.push(chat.render('user',r.users[i]));
    }
    }
     
    var message = '';
     
    if(r.total<1){
    message = 'Никого нет в онлайне';
    }
    else {
    message = 'В онлайне: ' + r.total;
    }
     
    users.push('<p>'+message+'</p>');
     
    $('#chatUsers').html(users.join(''));
     
    setTimeout(callback,15000);
    });
    },
    // Данный метод выводит сообщение об ошибке наверху страницы:
 
displayError : function(msg){
    var elem = $('<div>',{
    id : 'chatErrorMessage',
    html : msg
    });
     
    elem.click(function(){
    $(this).fadeOut(function(){
    $(this).remove();
    });
    });
     
    setTimeout(function(){
    elem.click();
    },5000);
     
    elem.hide().appendTo('body').slideDown();
    }
    };
     
    // Формирование GET & POST:
     
    $.tzPOST = function(action,data,callback){
    $.post('php/ajax.php?action='+action,data,callback,'json');
    }
     
    $.tzGET = function(action,data,callback){
    $.get('php/ajax.php?action='+action,data,callback,'json');
    }
     
    3
    // Метод jQuery для замещающего текста:
     
    $.fn.defaultText = function(value){
     
    var element = this.eq(0);
    element.data('defaultText',value);
     
    element.focus(function(){
    if(element.val() == value){
    element.val('').removeClass('defaultText');
    }
    }).blur(function(){
    if(element.val() == '' || element.val() == value){
    element.addClass('defaultText').val(value);
    }
    });
     
    return element.blur();
    }