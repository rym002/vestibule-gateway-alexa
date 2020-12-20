import { Alexa, Discovery, Video, VideoRecorder } from "@vestibule-link/alexa-video-skill-types";
import { DirectiveErrorResponse, EndpointState, ErrorHolder, Shadow, SubType } from "@vestibule-link/iot-types";
import { ContextPropertyReporter, DirectiveMessage, DirectiveResponseByNamespace, EndpointStateMetadata, EndpointStateMetadataValue, EndpointStateValue, NamedContextValue, ValidEndpointState, convertToContext } from "./DirectiveTypes";
import { TopicResponse } from "../iot";
import { EndpointRecord } from "./DiscoveryTypes";
import { DefaultEndpointOnHandler, MessageHandlingFlags, shadowToDate } from "./Endpoint";

type DirectiveNamespace = VideoRecorder.NamespaceType;
const namespace: DirectiveNamespace = VideoRecorder.namespace;

class Handler extends DefaultEndpointOnHandler<DirectiveNamespace> implements ContextPropertyReporter<DirectiveNamespace> {
    convertToProperty<K extends keyof Alexa.NamedContext[DirectiveNamespace],
        SK extends keyof NonNullable<EndpointState[DirectiveNamespace]>,
        MK extends keyof NonNullable<EndpointStateMetadata[DirectiveNamespace]>>(key: K,
            states: EndpointStateValue<DirectiveNamespace, SK>,
            metadata: EndpointStateMetadataValue<DirectiveNamespace, MK>): NamedContextValue<DirectiveNamespace, K> {
        return <NamedContextValue<DirectiveNamespace, K>><unknown>{
            namespace: namespace,
            name: key,
            value: states,
            timeOfSample: shadowToDate(metadata)
        }
    }

    getCapability(capabilities: NonNullable<SubType<EndpointRecord, DirectiveNamespace>>): SubType<Discovery.NamedCapabilities, DirectiveNamespace> {
        return {
            interface: namespace
        }
    }
    getEndpointMessageFlags(message: SubType<DirectiveMessage, DirectiveNamespace>, states: EndpointState): MessageHandlingFlags {
        return {
            request: message,
            sync: true
        }
    }
    createResponse(message: SubType<DirectiveMessage, DirectiveNamespace>,
        endpointShadow: ValidEndpointState,
        iotResp: TopicResponse): SubType<DirectiveResponseByNamespace, DirectiveNamespace> {
        let shadow: Shadow<EndpointState> = endpointShadow
        if (iotResp.shadow) {
            shadow = iotResp.shadow
        }
        const messageContext = convertToContext(shadow);

        const response = iotResp.response ? iotResp.response : { payload: {} }
        return {
            namespace: 'Alexa.VideoRecorder',
            name: 'Alexa.SearchAndRecordResponse',
            payload: <VideoRecorder.ResponsePayload>response.payload,
            context: <any>messageContext
        }
    }

    getError(error: any, message: SubType<DirectiveMessage, DirectiveNamespace>, messageId: string): SubType<DirectiveErrorResponse, DirectiveNamespace> {
        if (error.errorType) {
            const vError: ErrorHolder = error;
            if (vError.errorType === Video.namespace) {
                return <SubType<DirectiveErrorResponse, DirectiveNamespace>><unknown>{
                    namespace: vError.errorType,
                    name: 'ErrorResponse',
                    payload: vError.errorPayload
                }
            }
        }
        return super.getError(error, message, messageId);
    }
}

export default new Handler();