import { Alexa, Directive } from '@vestibule-link/alexa-video-skill-types';
import { ErrorHolder } from '@vestibule-link/iot-types';
import AlexaHandler from './Alexa';
import Authorization from './Authorization';
import ChannelController from './ChannelController';
import { ContextPropertyReporter, DirectiveHandler } from './DirectiveTypes';
import Discovery from './Discovery';
import EndpointHealth from './EndpointHealth';
import KeypadController from './KeypadController';
import Launcher from './Launcher';
import PlaybackController from './PlaybackController';
import PlaybackStateReporter from './PlaybackStateReporter';
import PowerController from './PowerController';
import RecordController from './RecordController';
import RemoteVideoPlayer from './RemoteVideoPlayer';
import SeekController from './SeekController';
import VideoRecorder from './VideoRecorder';



export type DirectiveHandlers = {
    [NS in Directive.Namespaces]: DirectiveHandler<NS>
}

const handlers: DirectiveHandlers = {
    'Alexa.ChannelController': ChannelController,
    'Alexa.PlaybackController': PlaybackController,
    'Alexa.PowerController': PowerController,
    'Alexa.RecordController': RecordController,
    'Alexa.SeekController': SeekController,
    'Alexa.Discovery': Discovery,
    'Alexa.Authorization': Authorization,
    'Alexa': AlexaHandler,
    'Alexa.RemoteVideoPlayer': RemoteVideoPlayer,
    'Alexa.Launcher': Launcher,
    'Alexa.VideoRecorder': VideoRecorder,
    'Alexa.KeypadController': KeypadController
};

export function findDirectiveHandler<NS extends Directive.Namespaces>(namespace: NS): DirectiveHandler<NS> {
    const ret = <DirectiveHandler<NS>>handlers[namespace];
    if (!ret) {
        const error: ErrorHolder = {
            errorType: 'Alexa',
            errorPayload: {
                type: 'INVALID_DIRECTIVE',
                message: 'Directive No Supported'
            }
        }
        throw error;
    }
    return ret;
}


export type ContextPropertyReporters = {
    [NS in Alexa.ContextInterfaces]: ContextPropertyReporter<NS>
}

export const contextReporters: ContextPropertyReporters = {
    'Alexa.ChannelController': ChannelController,
    'Alexa.EndpointHealth': EndpointHealth,
    'Alexa.PlaybackStateReporter': PlaybackStateReporter,
    'Alexa.PowerController': PowerController,
    'Alexa.RecordController': RecordController,
    'Alexa.Launcher': Launcher,
    'Alexa.VideoRecorder': VideoRecorder
}

export { stateToMetadata } from './Endpoint';

