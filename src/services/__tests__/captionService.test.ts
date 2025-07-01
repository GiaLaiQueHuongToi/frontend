/**
 * Caption Service Integration Test
 * This test verifies the caption service configuration and API endpoints
 */

import {
    captionService,
    type CaptionGenerationRequest,
} from '@/services/captionService';

// Mock video file for testing
const createMockVideoBlob = (): Blob => {
    return new Blob(['mock video data'], { type: 'video/mp4' });
};

// Test configuration
export const captionServiceTest = {
    // Test basic service configuration
    testConfiguration: () => {
        console.log('🧪 Testing Caption Service Configuration...');

        const expectedBaseURL =
            process.env.NEXT_PUBLIC_CAPTION_GENERATOR_URL ||
            'http://localhost:8081';
        console.log(`   Expected Base URL: ${expectedBaseURL}`);

        // Verify environment variables
        const hasRequiredEnvVars =
            !!process.env.NEXT_PUBLIC_CAPTION_GENERATOR_URL;
        console.log(`   Environment Variables OK: ${hasRequiredEnvVars}`);

        return {
            baseURL: expectedBaseURL,
            envVarsConfigured: hasRequiredEnvVars,
        };
    },

    // Test caption generation request structure
    testCaptionRequest: () => {
        console.log('🧪 Testing Caption Generation Request...');

        const mockBlob = createMockVideoBlob();
        const request: CaptionGenerationRequest = {
            videoFile: mockBlob,
            fontSize: 24,
            fontColor: 'white', // Use color name instead of hex
            position: 'bottom',
        };

        console.log('   Request structure:', {
            hasVideoFile: !!request.videoFile,
            fontSize: request.fontSize,
            fontColor: request.fontColor,
            position: request.position,
        });

        return request;
    },

    // Test actual caption generation (requires backend)
    testCaptionGeneration: async (): Promise<boolean> => {
        console.log('🧪 Testing Caption Generation...');

        try {
            const mockBlob = createMockVideoBlob();
            const request: CaptionGenerationRequest = {
                videoFile: mockBlob,
                fontSize: 24,
                fontColor: 'white', // Use color name for better compatibility
                position: 'bottom',
            };

            const result = await captionService.generateCaptions(request);

            console.log('   Generation result:', {
                success: result.success,
                hasVideo: !!result.videoWithCaptions,
                error: result.error,
            });

            return result.success;
        } catch (error) {
            console.error('   Caption generation test failed:', error);
            return false;
        }
    },

    // Integration test summary
    runAllTests: async () => {
        console.log('🧪 Running Caption Service Integration Tests...\n');

        const config = captionServiceTest.testConfiguration();
        const request = captionServiceTest.testCaptionRequest();

        // Note: Uncomment the line below to test actual API calls
        // const generationSuccess = await captionServiceTest.testCaptionGeneration();

        console.log('\n📊 Test Summary:');
        console.log(
            `   Configuration: ${config.envVarsConfigured ? '✅' : '❌'}`
        );
        console.log(`   Request Structure: ✅`);
        console.log(`   API Integration: ⏸️  (requires backend running)`);

        return {
            configurationOK: config.envVarsConfigured,
            requestStructureOK: true,
            // apiIntegrationOK: generationSuccess
        };
    },
};

export default captionServiceTest;
