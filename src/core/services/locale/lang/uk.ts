export default {
    start: {
        reply: 'Привіт!',
        authSuccess: 'Ви успішно авторизувалися',
        notInGroup: 'Ви не є учасником групи'
    },
    example: {
        reply: 'Команда успішно виконана!'
    },
    createrole: {
        invalidColor: "Невірний формат кольору. Використовуйте HEX код (наприклад, #FF0000).",
        roleName: `Назва`,
        roleCreatedTitle: `Роль створена`,
        colorField: 'Колір',
        hoistField: 'Виділяти',
        hoistYes: 'Так',
        hoistNo: 'Ні',
        error: 'Сталася помилка під час створення ролі.'
    },
    deleterole: {
        selectRolePlaceholder: "Виберіть роль для видалення",
        page: "Список ролей",
        roleRemoved: (roleName: string) => `Роль "${roleName}" видалено!`,
        error: "Сталася помилка під час видалення ролі.",
    },
    createchannel: {
        noPermission: 'У вас немає прав для використання цієї команди.',
        success: `Канал успішно створений!`,
        error: 'Сталася помилка під час створення каналу.'
    },
    auth: {
        alreadyAuthorized: 'Ви вже авторизовані',
        buttonLabel: 'Telegram Authentication',
    },
    telegram: {
        notAuthorized: 'Ви не авторизовані',
        roleNotFound: 'Роль не знайдена!',
        roleAdded: 'Роль видана!',
        roleRemoved: 'Роль знята!',
    },
    role: {
        creatorsCannotUse: "Творець не може використовувати цю команду.",
        limitedAdminRightsGranted: "Вам надано права адміністратора з обмеженими дозволами.",
        onlyInGroup: "Ця функція працює лише в групі.",
        botNotAdmin: "Боту потрібно бути адміністратором, щоб виконати цю дію."
    },
    roleScene: {
        enter: "Будь ласка, введіть нове ім'я (макс. 16 символів):",
        nameTooLong: "Ім'я занадто довге",
        titleChanged: (name: string) => `Ваш титул адміністратора змінено на "${name}".`,
        error: "Сталася помилка під час зміни титулу."
    },
    voice: {
        could_not_be_recognized: 'Не вдалося розпізнати текст.'
    }
};