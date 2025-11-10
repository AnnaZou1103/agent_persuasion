import * as React from 'react';
export const ChatBotType: SystemPurposeId[] =["suggestion", "clarification"]
export type SystemPurposeId = "suggestion" | "clarification" | 'Custom'

export const defaultSystemPurposeId: SystemPurposeId = ChatBotType[Math.floor(Math.random() * ChatBotType.length)];
import {DMessage} from '~/common/state/store-chats';
import {v4 as uuidv4 } from 'uuid';

type SystemPurposeData = {
  title: string;
  description: string | React.JSX.Element;
  systemMessage: string;
  symbol: string;
  imageUri?: string;
  examples?: string[];
  highlighted?: boolean;
  voices?: { elevenLabs?: { voiceId: string } };
};

export const SystemPurposes: { [key in SystemPurposeId]: SystemPurposeData } = {
    "suggestion": {
        "title": "ChatBot",
        "description": "suggestion",
        "systemMessage": "",
        "symbol": "💡",
        "examples": [
            "how are you today?"
        ]
    },
    "clarification": {
        "title": "ChatBot",
        "description": "clarification",
        "systemMessage": "",
        "symbol": "💡",
        "examples": [
            "how are you today?"
        ]
    },
  Custom: {
    title: 'Custom',
    description: 'User-defined purpose',
    systemMessage: 'You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4 architecture.\nCurrent date: {{Today}}',
    symbol: '💡',
  }
};


export const SurveyQuestions: DMessage[] = 
  [
    {id: uuidv4(),
    text:'In the evaluation process, you will find 15 statements about the chatbot that you are talking with. Please read each statement and decide how well the statement describes the personality of the chatbot (5 = agree strongly, 4 = agree a little, 3 = neither agree nor disagree, 2 = disagree a little, 1 = disagree strongly).',
    sender: 'Bot',
    avatar: null,
    typing: false,
    role: 'assistant',
    purposeId: defaultSystemPurposeId,
    tokenCount: 0,
    created: Date.now(),
    updated: null,
  }, {id: uuidv4(),
    text:'1. The chatbot tends to be quiet.',
    sender: 'Bot',
    avatar: null,
    typing: false,
    role: 'assistant',
    purposeId: defaultSystemPurposeId,
    choices: ['Disagree strongly', 'Disagree a little', 'Neither agree nor disagree', 'Agree a little', 'Agree strongly'],
    tokenCount: 0,
    created: Date.now(),
    updated: null,
  },{id: uuidv4(),
    text:'Thank you for your feedback. Please submit the questionnaire and enter the access code obtained after clicking the Submit button into the post-survey.',
    sender: 'Bot',
    avatar: null,
    typing: false,
    role: 'assistant',
    purposeId: defaultSystemPurposeId,
    tokenCount: 0,
    created: Date.now(),
    updated: null,
  }]
