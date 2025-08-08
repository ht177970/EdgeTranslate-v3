/**
 * detect users select action and take action after the detection
 * This function need to be called in the mouse down listener
 * @param {Node} targetElement target element to be detected
 * @param {Function} actionAfterSelect take this action after the select action detected
 * @param {Function} actionAfterNotSelect take this action if it's not select action
 */
export function detectSelect(targetElement, actionAfterSelect, actionAfterNotSelect) {
    // Remember whether mouse moved.
    let moved = false;

    // inner listener for detecting mousemove and mouseup.
    const detectMouseMove = () => {
        moved = true;
    };

    const detectMouseUp = (event) => {
        // select action detected
        if (moved) {
            if (typeof actionAfterSelect === "function") actionAfterSelect(event);
        } else if (typeof actionAfterNotSelect === "function") {
            // select action isn't detected
            actionAfterNotSelect(event);
        }
        // remove inner event listeners.
        targetElement.removeEventListener("mousemove", detectMouseMove);
        targetElement.removeEventListener("mouseup", detectMouseUp);
    };

    // add inner event listeners
    targetElement.addEventListener("mousemove", detectMouseMove);
    targetElement.addEventListener("mouseup", detectMouseUp);
}
