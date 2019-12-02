import * as React from "react";
import {css} from "@emotion/core";
import Button from "@skbkontur/react-ui/Button";
import ThemeProvider from "@skbkontur/react-ui/ThemeProvider";
import Switcher from "@skbkontur/react-ui/Switcher";
import FLAT_THEME from "@skbkontur/react-ui/lib/theming/themes/FlatTheme";
import { ViewMode } from "../ImagesView/ImagesView";

const modes: ViewMode[] = ["side-by-side", "swap", "slide", "blend"];
const SwitcherTheme = {
    ...FLAT_THEME,
    btnDefaultActiveBg: "none",
    btnDefaultHoverBg: "none",
    btnDefaultHoverBgStart: "none",
    btnDefaultHoverBgEnd: "none",
    btnDefaultBorder: "1px solid transparent",
    btnDefaultHoverBorderColor: "transparent"
};

interface ResultsPageHeaderProps {
    imageName: string;
    imagesNames: string[];
    diff?: string;
    expect?: string;
    mode: ViewMode;
    handleImageChange: (imageName: string) => void;
    handleChangeView:  (_: any, mode: any)  => void;
}

export class ResultsPageHeader extends React.Component<ResultsPageHeaderProps> {
    public render() {
        const {imagesNames, imageName, mode, diff, expect} = this.props;
        return (
            <>
                <div css={css`
                            padding: 5px 20px;
                        `}>
                    {imagesNames.map(name =>
                        <Button
                            use="link"
                            onClick={() => this.props.handleImageChange(name)}
                            disabled={name === imageName}>{name}</Button>
                    )}
                </div>
                {diff && expect ? (
                    <>
                        <ThemeProvider value={SwitcherTheme}>
                            <Switcher items={modes} onChange={this.props.handleChangeView} value={mode} />
                        </ThemeProvider>
                    </>
                ) : null}
            </>
        );
    }
}