declare module "WebGLDebugUtils" {
	export interface WebGLDebugUtils {
		log(msg: string): void;
		glValidEnumContexts: { [key: string]: { [key: number]: boolean } };
		glEnums: { [key: number]: string } | null;
		init(ctx: WebGLRenderingContext): void;
		checkInit(): void;
		mightBeEnum(value: any): boolean;
		glEnumToString(value: number): string;
		glFunctionArgToString(
			functionName: string,
			argumentIndex: number,
			value: any,
		): string;
		makeDebugContext(
			ctx: WebGLRenderingContext,
			opt_onErrorFunc?: (
				err: number,
				functionName: string,
				args: IArguments,
			) => void,
		): WebGLRenderingContext;
		resetToInitialState(ctx: WebGLRenderingContext): void;
		makeLostContextSimulatingContext(
			ctx: WebGLRenderingContext,
		): WebGLRenderingContext;
	}

	export const WebGLDebugUtils: WebGLDebugUtils;
}
