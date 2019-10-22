import { ChannelController } from '@vestibule-link/alexa-video-skill-types';
import { EndpointCapability, ResponseMessage } from '@vestibule-link/iot-types';
import 'mocha';
import { createSandbox } from 'sinon';
import { resetDirectiveMocks } from '../mock/DirectiveMocks';
import { resetIotDataPublish } from '../mock/IotDataMock';
import { MockMqttOperations } from '../mock/MqttMock';
import { DirectiveMessageContext, errors, EventMessageContext, generateReplyTopicName, mockErrorSuffix, setupDisconnectedBridge, setupInvalidEndpoint, setupMqttMock, setupNotWatchingTv, setupPoweredOff, setupWatchingTv, sharedStates, testDisconnectedBridge, testInvalidEndpoint, testMockErrorResponse, testNotWatchingTvEndpoint, testPoweredOffEndpoint, testSuccessfulMessage } from './TestHelper';

describe('ChannelController', function () {
    const skipChannelsHeader = {
        namespace: 'Alexa.ChannelController',
        name: 'SkipChannels',
        correlationToken: '123'
    }

    const changeChannelHeader = {
        namespace: 'Alexa.ChannelController',
        name: 'ChangeChannel',
        correlationToken: '123'
    }
    const changeChannelRequest: ChannelController.ChangeChannelRequest = {
        channel: {
            number: '1',
            callSign: "CALL"
        }
    }
    const skipChannelsRequest: ChannelController.SkipChannelsRequest = {
        channelCount: 1
    }

    const capabilities: EndpointCapability = {
        "Alexa.ChannelController": ['channel']
    }
    const changeChannelMessageSuffix = 'changeChannel';
    const skipChannelsMessageSuffix = 'skipChannels'
    const skipChannelsContext: DirectiveMessageContext = {
        request: skipChannelsRequest,
        messageSuffix: skipChannelsMessageSuffix,
        header: skipChannelsHeader
    }

    const changeChannelContext: DirectiveMessageContext = {
        request: changeChannelRequest,
        messageSuffix: changeChannelMessageSuffix,
        header: changeChannelHeader
    }

    const eventContext: EventMessageContext = {
        context: [{
            namespace: 'Alexa.ChannelController',
            name: 'channel',
            value: sharedStates.channel['Alexa.ChannelController']!.channel!
        }],
        header: {
            namespace: 'Alexa',
            name: 'Response'
        },
        response: {}
    }

    context(('connected bridge'), function () {
        const sandbox = createSandbox()
        const responseMockHandler = (topic: string | string[], mqttMock: MockMqttOperations) => {
            let resp: ResponseMessage<any> | undefined;
            const channelTopic = generateReplyTopicName(changeChannelMessageSuffix);
            const skipTopic = generateReplyTopicName(skipChannelsMessageSuffix);
            if (topic == channelTopic
                || topic == skipTopic) {
                resp = {
                    payload: {},
                    stateChange: {
                        'Alexa.ChannelController': changeChannelRequest
                    },
                    error: false
                }
            } else if (topic == generateReplyTopicName(mockErrorSuffix)) {
                resp = {
                    payload: errors.bridgeError,
                    error: true
                }

            }
            if (resp && 'string' == typeof topic) {
                mqttMock.sendMessage(topic, resp);
            }
        }
        afterEach(function () {
            sandbox.restore()
        })

        context('Watching TV', function () {
            before(async function () {
                await setupWatchingTv();
            })
            after(() => {
                resetDirectiveMocks()
            })
            context('SkipChannels', function () {
                const messageContext = skipChannelsContext;
                beforeEach(function (){
                    setupMqttMock(responseMockHandler,sandbox,messageContext)
                })
                afterEach(function (){
                    resetIotDataPublish()
                })
                it('should send a request to change channel', async function () {
                    await testSuccessfulMessage(messageContext, eventContext)
                })
                it('should map an error', async function () {
                    await testMockErrorResponse({ ...messageContext, messageSuffix: mockErrorSuffix });
                })
            })
            context('ChangeChannel', function () {
                const messageContext = changeChannelContext;
                beforeEach(function (){
                    setupMqttMock(responseMockHandler,sandbox,messageContext)
                })
                afterEach(function (){
                    resetIotDataPublish()
                })
                it('should change channel if not on the current channel', async function () {
                    await testSuccessfulMessage(messageContext, eventContext)
                })
                it('should return success if its on the same channel', async function () {
                    await testSuccessfulMessage({
                        ...messageContext,
                        request: {
                            channel: sharedStates.channel['Alexa.ChannelController']!.channel!
                        }
                    }, eventContext)
                })
                it('should map an error', async function () {
                    await testMockErrorResponse({ ...messageContext, messageSuffix: mockErrorSuffix });
                })
            })
        })
        context('Not Watching TV', function () {
            before(async function () {
                await setupNotWatchingTv();
            })
            after(() => {
                resetDirectiveMocks()
            })
            context('SkipChannels', function () {
                const messageContext = skipChannelsContext;
                it('should return NOT_SUPPORTED_IN_CURRENT_MODE', async function () {
                    await testNotWatchingTvEndpoint(messageContext);
                })
            })
            context('ChangeChannel', function () {
                const messageContext = changeChannelContext;
                beforeEach(function (){
                    setupMqttMock(responseMockHandler,sandbox,messageContext)
                })
                afterEach(function (){
                    resetIotDataPublish()
                })
                it('should send a message', async function () {
                    await testSuccessfulMessage(messageContext, eventContext)
                })

            })
        })
        context('Power Off', function () {
            before(async function () {
                await setupPoweredOff();
            })
            after(() => {
                resetDirectiveMocks()
            })
            context('SkipChannels', function () {
                const messageContext = skipChannelsContext;
                it('should return NOT_IN_OPERATION', async function () {
                    await testPoweredOffEndpoint(messageContext)
                })
            })
            context('ChangeChannel', function () {
                const messageContext = changeChannelContext;
                it('should return NOT_IN_OPERATION', async function () {
                    await testPoweredOffEndpoint(messageContext)
                })

            })

        })
        context('Invalid Endpoint', function () {
            before(async function () {
                await setupInvalidEndpoint();
            })
            after(() => {
                resetDirectiveMocks()
            })
            context('SkipChannels', function () {
                const messageContext = skipChannelsContext;
                it('should return NO_SUCH_ENDPOINT', async function () {
                    await testInvalidEndpoint(messageContext);
                })
            })
            context('ChangeChannel', function () {
                const messageContext = changeChannelContext;
                it('should return NO_SUCH_ENDPOINT', async function () {
                    await testInvalidEndpoint(messageContext);
                })
            })

        })
    })
    context(('disconnected bridge'), function () {
        before(async function () {
            await setupDisconnectedBridge();
        })
        after(() => {
            resetDirectiveMocks()
        })
        context('SkipChannels', function () {
            const messageContext = skipChannelsContext;
            it('should return BRIDGE_UNREACHABLE', async function () {
                await testDisconnectedBridge(messageContext);
            })
        })
        context('ChangeChannel', function () {
            const messageContext = changeChannelContext;
            it('should return BRIDGE_UNREACHABLE', async function () {
                await testDisconnectedBridge(messageContext);
            })

        })
    })
})
