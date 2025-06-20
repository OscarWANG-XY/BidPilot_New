import React from 'react';
// import TestSSE from './TestSSE';
import Test_sse_v2 from './Test_sse_api';




interface TestContainerProps {
    projectId: string;
}

export const TestContainer: React.FC<TestContainerProps> = ({projectId}) => {



    return (
        <div>
            {/* <TestSSE /> */}
            <Test_sse_v2 projectId={projectId}/>
        </div>
    );
};


export default TestContainer;