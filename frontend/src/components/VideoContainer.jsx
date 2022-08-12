import styled, {css} from "styled-components";

const VideoRayoutContainer = ({l, streamArray, myStream}) => {
    return (
        <>
            <RayoutContainer l={l} w={20}>
                <VideoBox  stream={myStream} autoPlay></VideoBox>
                {
                    streamArray.map((item, key) => (
                        <VideoBox key={key} stream={item.stream} />
                    ))
                }
            </RayoutContainer>
        </>
    );
};
