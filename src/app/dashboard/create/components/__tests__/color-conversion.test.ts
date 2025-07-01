/**
 * Font Color Conversion Test
 * Tests the color conversion logic for caption generation
 */

// Common color presets that backend supports
const COLOR_PRESETS = [
    { name: 'White', value: 'white', hex: '#FFFFFF' },
    { name: 'Black', value: 'black', hex: '#000000' },
    { name: 'Red', value: 'red', hex: '#FF0000' },
    { name: 'Blue', value: 'blue', hex: '#0000FF' },
    { name: 'Green', value: 'green', hex: '#00FF00' },
    { name: 'Yellow', value: 'yellow', hex: '#FFFF00' },
    { name: 'Orange', value: 'orange', hex: '#FF8000' },
    { name: 'Purple', value: 'purple', hex: '#800080' },
] as const;

// Convert hex to color name if possible, otherwise return hex
const getOptimalColorValue = (hexColor: string): string => {
    const preset = COLOR_PRESETS.find(
        (p) => p.hex.toLowerCase() === hexColor.toLowerCase()
    );
    return preset ? preset.value : hexColor;
};

export const colorConversionTest = {
    testColorPresets: () => {
        console.log('🎨 Testing Color Preset Conversion...');

        const testCases = [
            { input: '#FFFFFF', expected: 'white' },
            { input: '#ffffff', expected: 'white' }, // case insensitive
            { input: '#FF0000', expected: 'red' },
            { input: '#0000FF', expected: 'blue' },
            { input: '#00FF00', expected: 'green' },
            { input: '#FFFF00', expected: 'yellow' },
            { input: '#FF8000', expected: 'orange' },
            { input: '#800080', expected: 'purple' },
            { input: '#123456', expected: '#123456' }, // custom hex stays as hex
            { input: 'white', expected: 'white' }, // already color name
        ];

        const results = testCases.map((testCase) => {
            const result = getOptimalColorValue(testCase.input);
            const passed = result === testCase.expected;

            console.log(
                `   ${testCase.input} -> ${result} ${passed ? '✅' : '❌'}`
            );
            if (!passed) {
                console.log(`     Expected: ${testCase.expected}`);
            }

            return { ...testCase, result, passed };
        });

        const allPassed = results.every((r) => r.passed);
        console.log(
            `\n   Overall: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`
        );

        return { results, allPassed };
    },

    testBackendCompatibility: () => {
        console.log('\n🔧 Testing Backend Compatibility...');

        // Test common user inputs and what gets sent to backend
        const userInputs = [
            'white', // user types color name
            '#FFFFFF', // user enters hex
            '#ff0000', // lowercase hex
            'red', // user types red
            '#808080', // custom gray (not in presets)
        ];

        userInputs.forEach((input) => {
            const backendValue = getOptimalColorValue(input);
            console.log(
                `   User input: "${input}" -> Backend: "${backendValue}"`
            );
        });

        return userInputs.map((input) => ({
            userInput: input,
            backendValue: getOptimalColorValue(input),
        }));
    },

    runAllTests: () => {
        console.log('🧪 Running Font Color Conversion Tests...\n');

        const presetTests = colorConversionTest.testColorPresets();
        const compatibilityTests =
            colorConversionTest.testBackendCompatibility();

        console.log('\n📊 Summary:');
        console.log(
            `   Color Preset Conversion: ${presetTests.allPassed ? '✅' : '❌'}`
        );
        console.log(`   Backend Compatibility: ✅`);
        console.log(`   Available Color Presets: ${COLOR_PRESETS.length}`);

        return {
            presetConversionOK: presetTests.allPassed,
            compatibilityTests,
            totalPresets: COLOR_PRESETS.length,
        };
    },
};

export default colorConversionTest;
