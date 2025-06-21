import React from 'react';
// import TestSSE from './TestSSE';
// import Test_useSSE from '@/_hooks/useProjectAgent/tests/TestSSE';
// import TestDocuments from '@/_hooks/useProjectAgent/tests/TestDocuments';
// import QueryTestComponent from '@/_hooks/useProjectAgent/tests/TestQueries';

import ProjectFileManagerContainer from '@/components/projects/Components/FileUpload/ProjectFileManagerContainer';


interface TestContainerProps {
    projectId: string;
}

export const TestContainer: React.FC<TestContainerProps> = ({projectId}) => {
    return (

        <>

            <h1> ------------- FileUploadModule -------------</h1>
            <div>
                <ProjectFileManagerContainer projectId={projectId} />
            </div>

            <h1> ------------- QueryTestComponent -------------</h1>
            <div>
                {/* <QueryTestComponent projectId={projectId} /> */}
            </div>


            <br />
            <br />
            <br />

            <h1> ------------- TestDocuments -------------</h1>
            <div>
                {/* <TestDocuments projectId={projectId} keyName="raw_document" /> */}
            </div>


            <br />

            <h1> ------------- Test_useSSE -------------</h1>
            <div>
                {/* <Test_useSSE projectId={projectId} /> */}
            </div>




        </>

    );
};


export default TestContainer;