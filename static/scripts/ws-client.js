const stompClient = new StompJs.Client({
    brokerURL: 'ws://localhost:8080/chat'
});

let receiverUsername = $("#receiver-username").data("username");
let senderUsername = $("#current-username").data("username");
let chatroom = [senderUsername, receiverUsername].sort().join("-");

stompClient.onConnect = (frame) => {
    console.log('Connected: ' + frame);

    stompClient.subscribe(`/topic/chatroom/${chatroom}`, (message) => {
        console.log("Подписали на 1");
        showMessages(JSON.parse(message.body));
    });

    stompClient.subscribe(`/topic/notifications/${senderUsername}`, (notification) => {
        console.log("Подписали на уведомления");
        showNotification(JSON.parse(notification.body));
    });
};

stompClient.onWebSocketError = (error) => {
    console.error('Error with websocket', error);
};

stompClient.onStompError = (frame) => {
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
};

function connect() {
    stompClient.activate();
}

function disconnect() {
    stompClient.deactivate();
    console.log("Disconnected");
}

function sendMessage() {
    let messageContent = $("#message").val();
    stompClient.publish({
        destination: `/messenger/send-message/${chatroom}/${receiverUsername}`,
        body: messageContent
    });

    let messagesContainer = document.getElementById("messages");
    smoothScrollTo(messagesContainer, messagesContainer.scrollHeight, 700);
}

function deleteMessage(button) {
    const messageDiv = button.closest('.user-message-o');

    const messageId = messageDiv.getAttribute('data-messageId');

    stompClient.publish({
        destination: `/messenger/delete-message/${chatroom}/` + messageId,
        body: JSON.stringify(messageId)
    });

    messageDiv.remove();
}

let previousMessageSender = null;
let streak = 0;
let receiverPicture = $("#receiver-picture").data("picture");

function showMessages(message) {
    if (receiverPicture === undefined)
        receiverPicture = "/images/person.jpg";

    if (message.senderUsername !== senderUsername) {
        showNotification(message.senderUsername, message.content);
    }

    if (message.senderUsername === senderUsername) {
        let newMessage = $("<div class='my-account'>" +
            "<div class='user-message-o own-message'>" +
            "<p>" + message.content + "</p>" +
            "<button class='delete-message-button' onClick='deleteMessage(this)'>" +
            "&times;" +
            "</button>" +
            "</div>" +
            "</div>");

        newMessage.find('.own-message').attr('data-messageId', message.messageId);

        $("#messages").append(newMessage)

        previousMessageSender = null;

        let lastSenderMessages = $(".user-message-n[data-streak='" + streak + "']");
        if (lastSenderMessages.length > 0) {
            lastSenderMessages.removeAttr('data-streak');
        }
        streak = 0;
    } else {
        if (previousMessageSender === message.senderUsername) {
            if (streak === 0) {
                let elementToModify = $(".user-message-n[data-streak='" + streak + "']");
                let textFromParagraph = elementToModify.find('.user-message p').text();
                elementToModify.html(
                    "<p class='messenger-username'>" + message.senderUsername + "</p>" +
                    "<div class='user-message-picture'>" +
                    "<p>" + textFromParagraph +
                    "</p>" +
                    "</div>"
                );
                elementToModify.removeAttr('data-streak');
            } else {
                let elementToModify = $(".user-message-n[data-streak='" + streak + "']");
                let textFromParagraph = elementToModify.find('.user-message p').text();
                elementToModify.html(
                    "<div class='user-message-picture'>" +
                    "<p>" + textFromParagraph +
                    "</p>" +
                    "</div>"
                );
                elementToModify.removeAttr('data-streak');
            }

            streak++;

            $("#messages").append(
                "<div class='user-message-n' data-streak='" + streak + "'>" +
                "<div>" +
                "<img src='" + receiverPicture + "' alt='Profile Picture' class='message-pic'/>" +
                " " +
                "<div class='user-message'>" +
                "<p>" + message.content +
                "</p>" +
                "</div>" +
                "</div>" +
                "</div>");
        } else {
            let lastSenderMessages = $(".user-message-n[data-streak='" + streak + "']");
            if (lastSenderMessages.length > 0) {
                lastSenderMessages.removeAttr('data-streak');
            }
            streak = 0;

            $("#messages").append(
                "<div class='user-message-n' data-streak='" + streak + "'>" +
                "<p class='messenger-username'>" + message.senderUsername + "</p>" +
                "<div>" +
                "<img src='" + receiverPicture + "' alt='Profile Picture' class='message-pic'/>" +
                "<div class='user-message'>" +
                "<p>" + message.content + "</p>" +
                "</div>" +
                "</div>" +
                "</div>");
        }
        previousMessageSender = message.senderUsername;
    }
}

function showNotification(sender, content) {
    $("#notification-container").append(
        "<div class='notification'>" +
        "<p>" + sender + " Отправил сообщение: " + content + "</p>" +
        "</div>"
    );
    console.log("Сами уведомления");

    // Дополнительно можно использовать браузерные уведомления (Notification API)
    if (Notification.permission === "granted") {
        new Notification(sender, { body: content });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                new Notification(sender, { body: content });
            }
        });
    }
}

$(function () {
    $(".message-form").on('submit', (e) => e.preventDefault());
    connect();
    $("#disconnect").click(() => disconnect());
    $("#send").click(() => sendMessage());
});

/*function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    }
    else {
        $("#conversation").hide();
    }
    $("#messages").html("");
}*/