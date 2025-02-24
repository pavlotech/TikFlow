export default {
    start: {
        reply: 'Привет!',
        authSuccess: 'Вы успешно авторизировались',
        notInGroup: 'Вы не член группы'
    },
    example: {
        reply: 'Команда успешно выполнена!'
    },
    createrole: {
        invalidColor: "Неверный формат цвета. Используйте HEX код (например, #FF0000).",
        roleName: `Название`,
        roleCreatedTitle: `Роль создана`,
        colorField: 'Цвет',
        hoistField: 'Выделять',
        hoistYes: 'Да',
        hoistNo: 'Нет',
        error: 'Произошла ошибка при создании роли.'
    },
    deleterole: {
        selectRolePlaceholder: "Выберите роль для удаления",
        page: "Список ролей",
        roleRemoved: (roleName: string) => `Роль "${roleName}" удалена!`,
        error: "Произошла ошибка при удалении роли.",
    },
    createchannel: {
        noPermission: 'У вас нет прав для использования этой команды.',
        success: `Канал успешно создан!`,
        error: 'Произошла ошибка при создании канала.'
    },
    auth: {
        alreadyAuthorized: 'Вы уже авторизованы',
        buttonLabel: 'Telegram Authentication',
    },
    telegram: {
        notAuthorized: 'Вы не авторизированы',
        roleNotFound: 'Роль не найдена!',
        roleAdded: 'Роль выдана!',
        roleRemoved: 'Роль снята!',
    },
    role: {
        creatorsCannotUse: "Создатель не может использовать эту команду.",
        limitedAdminRightsGranted: "Вам были предоставлены права администратора с ограниченными разрешениями.",
        onlyInGroup: "Эта функция работает только в группе.",
        botNotAdmin: "Боту необходимо быть администратором для выполнения этого действия."
    },
    roleScene: {
        enter: "Пожалуйста, введите новое имя (макс. 16 символов):",
        nameTooLong: "Имя слишком длинное",
        titleChanged: (name: string) => `Ваш титул администратора изменен на "${name}".`,
        error: "Произошла ошибка при изменении титула."
    },
    voice: {
        could_not_be_recognized: 'Не удалось распознать текст.'
    }
};