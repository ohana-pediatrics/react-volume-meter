import styled from "styled-components";

export const StyledVolumeMeter = styled.div<{ width: number; height: number }>`
  height: ${(props) => props.height}px;
  width: ${(props) => props.width}px;
  position: relative;
`;

export const Bars = styled.canvas<{ show: boolean }>`
  display: ${(props) => (props.show ? "block" : "none")};
`;

const margin = 10;
export const NoStream = styled.div<{ height: number }>`
  position: absolute;
  top: ${margin}px;
  bottom: ${margin}px;
  left: 0;
  right: 0;
  line-height: ${(props) => props.height - 2 * margin}px;
  margin: auto;
  text-align: center;
  background-color: lightgray;
`;
