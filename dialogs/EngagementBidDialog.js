// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { MessageFactory, InputHints } = require('botbuilder');
const {
    AttachmentPrompt,
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { Channels } = require('botbuilder-core');

const ATTACHMENT_PROMPT = 'ATTACHMENT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';

const WATERFALL_DIALOG = 'waterfallDialog';

class EngagementBidDialog extends ComponentDialog {
    constructor(id) {
        super(id || 'engagementBidDialog');
        console.log('idddddddd', id)
        this.addDialog(new TextPrompt(NAME_PROMPT))
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.engagementIdStep.bind(this),
            this.engagementIdConfirmStep.bind(this),
            this.fetchEngagementDetailsStep.bind(this),
            this.selectPropertyStep.bind(this),
            this.selectPropertyBidTurnaroundUnitStep.bind(this),
            this.selectPropertyBidTurnaroundTimeStep.bind(this),
            this.selectBidAmountStep.bind(this),
            this.summaryStep.bind(this),
            this.submitBidStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async engagementIdStep(stepContext) {
        console.log(stepContext.options)
            console.log('result')
            const messageText = 'Enter Engagement Id.';
           return  await stepContext.prompt(NAME_PROMPT, messageText);
          
    }

    async engagementIdConfirmStep(stepContext) {
        const engagementId = stepContext.result
        stepContext.options['engagementId'] = engagementId
         await stepContext.context.sendActivity(`You've entered Engagement Id as: ${engagementId}` );
        return await stepContext.prompt(CONFIRM_PROMPT, 'Do you want to proceed ?', ['Yes', 'No']);
    }

    async fetchEngagementDetailsStep(stepContext) {
        console.log('fetching engagement', stepContext.result)
        let engagementData = {
            properties: [
                {name: 'Hope Farm, 22002, United States', id: '11111111'},
                {name: 'Washington Ave, 11153, United States', id: '222222'}
            ]
        }
        stepContext.options['engagement'] = engagementData
        await stepContext.prompt(NAME_PROMPT, 'Fetching Engagement Details. Please wait.')
        return stepContext.next(engagementData)
        
    }

    async selectPropertyStep(stepContext) {
        console.log('select Property Context', stepContext.result)
        let choices = []
        stepContext.result.properties.forEach(property => {
            let choice = {
                value: property.id,
                synonyms: [property.name, ...property.name.split(', ')],
                action: {
                    title: property.name
                }
            }
            choices.push(choice)
        })
        const options = {
            prompt: 'Select the property you want to bid on.',
            retryPrompt: 'That was not a valid choice, please select an option from below',
            choices: choices
        };
        return await stepContext.prompt('CHOICE_PROMPT', options);
    }

    async selectPropertyBidTurnaroundUnitStep(stepContext) {
        stepContext.options['selectedProperty'] = stepContext.result

        const options = {
            prompt: 'Select the turnaround unit.',
            retryPrompt: 'That was not a valid choice, please select an option from below',
            choices: [
                {
                    value: '1',
                    synonyms: ['Business', 'Business Days'],
                    action: {
                        title: 'Business Days'
                    }
                },
                {
                    value: '2',
                    synonyms: ['Calender', 'Calender Days'],
                    action: {
                        title: 'Calender Days'
                    }
                },
                {
                    value: '3',
                    synonyms: ['Weeks'],
                    action: {
                        title: 'Weeks'
                    }
                },
                {
                    value: '4',
                    synonyms: ['Specific', 'Specific Day'],
                    action: {
                        title: 'Specific Day'
                    }
                },
            ]
        };
        return await stepContext.prompt('CHOICE_PROMPT', options);
    }

    async selectPropertyBidTurnaroundTimeStep(stepContext) {
        stepContext.options['turnaroundUnit'] = stepContext.result
        console.log('stepContext Options', stepContext.options)
       return await stepContext.prompt(NAME_PROMPT, "Enter the turnaround time");
    }

    async selectBidAmountStep(stepContext) {
        stepContext.options['turnaroundTime'] = stepContext.result
        console.log('stepContext Options', stepContext.options)
       return await stepContext.prompt(NAME_PROMPT, "Enter the Bid Amount in $");
    }

    getTurnaroundUnits() {
        return [
            {id: '1', name: 'Business Days'},
            {id: '2', name: 'Calender Days'},
            {id: '3', name: 'Weeks'},
            {id: '4', name: 'Specific Day'}
        ]
    }
    async summaryStep(stepContext) {
        stepContext.options['bidAmount'] = stepContext.result
        let engagementId = stepContext.options.engagementId
        let engagement = stepContext.options.engagement
        let propertyId = stepContext.options.selectedProperty.value
        let propertyName = engagement.properties.find(item => item.id == propertyId).name
        let turnaroundTime = stepContext.options['turnaroundTime']
        let bidAmount = stepContext.options['bidAmount']
        let turnaroundUnit = this.getTurnaroundUnits().find(item => item.id == stepContext.options['turnaroundUnit'].value).name
        
        const summary = `Summary\n
        Engagement:         ${engagementId} \n
        Property:           ${propertyName} \n
        Turnaround Time:    ${turnaroundTime} ${turnaroundUnit}\n
        Bid Amount:         $${bidAmount}`
         await stepContext.context.sendActivity(summary);
        return await stepContext.prompt(CONFIRM_PROMPT, 'Do you want to proceed ?', ['Yes', 'No']);
    }

    async submitBidStep(stepContext) {
       let confirm = stepContext.result
       if(confirm) {
       await stepContext.context.sendActivity("Please wait while we submit the Bid. ");
       await stepContext.context.sendActivity("Bid Submitted Successfully");
       }
       return stepContext.next(confirm)
    }

    async finalStep(stepContext) {
        console.log('stepString', stepContext.options)
       return await stepContext.endDialog(stepContext.options)
    }
}

module.exports.EngagementBidDialog = EngagementBidDialog;
