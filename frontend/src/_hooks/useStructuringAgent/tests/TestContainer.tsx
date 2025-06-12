import React from 'react';
// import TestSSE from './TestSSE';
// import Test_useSSE from './Test_useSSE';
import TestAgentData from './Test_useQueries';

const PROJECT_ID = 'f6db0cbe-e7af-4300-8335-01ba4ffdbb93'

export const TestContainer: React.FC = () => {
    return (
        <div>
            {/* <TestSSE /> */}
            {/* <Test_useSSE projectId={PROJECT_ID} /> */}
            <TestAgentData projectId={PROJECT_ID} />
        </div>
    );
};