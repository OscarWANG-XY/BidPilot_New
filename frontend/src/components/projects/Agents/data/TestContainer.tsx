import React from 'react';
// import TestSSE from './TestSSE';
import Test_useSSE from '@/_hooks/useStructuringAgent/tests/TestSSE';
import TestDocuments from '@/_hooks/useStructuringAgent/tests/TestDocuments';

import QueryTestComponent from '@/_hooks/useStructuringAgent/tests/TestQueries';



interface TestContainerProps {
    projectId: string;
}

export const TestContainer: React.FC<TestContainerProps> = ({projectId}) => {
    return (

        <>



            <h1> ------------- QueryTestComponent -------------</h1>
            <div>
                <QueryTestComponent projectId={projectId} />
            </div>


            <br />
            <br />
            <br />

            <h1> ------------- TestDocuments -------------</h1>
            <div>
                <TestDocuments projectId={projectId} />
            </div>


            <br />

            <h1> ------------- Test_useSSE -------------</h1>
            <div>
                <Test_useSSE projectId={projectId} />
            </div>




        </>

    );
};


export default TestContainer;