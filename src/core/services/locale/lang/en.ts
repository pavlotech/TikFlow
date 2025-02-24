export default {
    start: {
        reply: 'Hello!',
        authSuccess: 'You have successfully authorized',
        notInGroup: 'You are not a member of the group'
    },
    example: {
        reply: 'Command executed successfully!'
    },
    createrole: {
        invalidColor: "Invalid color format. Please use a HEX code (e.g., #FF0000).",
        roleName: `Name`,
        roleCreatedTitle: `Role created`,
        colorField: 'Color',
        hoistField: 'Hoist',
        hoistYes: 'Yes',
        hoistNo: 'No',
        error: 'An error occurred while creating the role.'
    },
    deleterole: {
        selectRolePlaceholder: "Select a role to delete",
        page: "List of roles",
        roleRemoved: (roleName: string) => `Role "${roleName}" has been removed!`,
        error: "An error occurred while deleting the role.",
    },
    createchannel: {
        noPermission: 'You do not have permission to use this command.',
        success: `Channel created successfully!`,
        error: 'An error occurred while creating the channel.'
    },
    auth: {
        alreadyAuthorized: 'You are already authorized',
        buttonLabel: 'Telegram Authentication',
    },
    telegram: {
        notAuthorized: 'You are not authorized',
        roleNotFound: 'Role not found!',
        roleAdded: 'Role added!',
        roleRemoved: 'Role removed!',
    },
    role: {
        creatorsCannotUse: "The creator cannot use this command.",
        limitedAdminRightsGranted: "You have been granted administrator rights with limited permissions.",
        onlyInGroup: "This function only works in a group.",
        botNotAdmin: "The bot needs to be an administrator to perform this action."
    },
    roleScene: {
        enter: "Please enter the new name (max 16 characters):",
        nameTooLong: "Name is too long",
        titleChanged: (name: string) => `Your admin title has been changed to "${name}".`,
        error: "An error occurred while changing the title."
    },
    voice: {
        could_not_be_recognized: 'The text could not be recognized.'
    }
};