
const { ChoicePrompt, ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
// Engagement Bid Dialog
const { EngagementBidDialog } = require('./EngagementBidDialog');
const ENGAGEMENT_BID_DIALOG = 'engagementBidDialog';
const { UserProfile } = require('../userProfile');
const USER_PROFILE = 'USER_PROFILE';
let i = 0
class MainDialog extends ComponentDialog {
    constructor(userState) {
        super('MainDialog');
        this.userProfile = userState.createProperty(USER_PROFILE)
        // Define the main dialog and its related components.
        this.addDialog(new ChoicePrompt('cardPrompt'))
            .addDialog(new TextPrompt('TextPrompt'))
            .addDialog(new EngagementBidDialog(ENGAGEMENT_BID_DIALOG))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.initialDialog.bind(this),
                this.choiceCardStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (i < 1&& results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
            i++
        }
    }

    async initialDialog(stepContext) {
        if(stepContext.options.restartMsg) {
           return await stepContext.context.sendActivity(stepContext.options.restartMsg)
        } else {
            return stepContext.next(stepContext)
        }
    }

    async choiceCardStep(stepContext) {
        const options = {
            prompt: 'Choose from below options',
            retryPrompt: 'That was not a valid choice, please select an option from below',
            choices: this.getChoices()
        };
        return await stepContext.prompt('cardPrompt', options);
    }

    getChoices() {
        const cardOptions = [
            {
                value: 'Bid On Engagement',
                synonyms: ['engagementBid, bid, bid on engagement']
            },
            {
                value: 'Option 2'
            },
            {
                value: 'Option 3'
            }
        ];

        return cardOptions;
    }

    async actStep(stepContext) {
        return await stepContext.beginDialog(ENGAGEMENT_BID_DIALOG, {engagementId:null, engagementIdConfirm: null});
    }

    async finalStep(stepContext) {
        await stepContext.context.sendActivity('')
        // Restart the main dialog with a different message the second time around
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
}

module.exports.MainDialog = MainDialog;
