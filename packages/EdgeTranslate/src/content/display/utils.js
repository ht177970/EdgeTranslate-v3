/**
 * Utility functions for display components
 */

/**
 * Check whether the translation result is the latest.
 * @param {number} timestamp the timestamp of the new translation result
 * @returns true if the result is the latest
 */
export function checkTimestamp(timestamp) {
    /**
     * Check message timestamp.
     *
     * translateResult keeps the latest(biggest) timestamp ever received.
     */
    if (window.translateResult && window.translateResult.timestamp) {
        /**
         * When a new message with timestamp arrived, we check if the timestamp stored in translateResult
         * is bigger than the timestamp of the arriving message.
         */
        if (window.translateResult.timestamp > timestamp) {
            /**
             * If it does, which means the corresponding translating request is out of date, we drop the
             * message.
             */
            return false;
        }
        /**
         * If it doesn't, which means the corresponding translating request is up to date, we accept the message.
         * Note: timestamp will be updated by the actual message handler, not here.
         */
    }
    return true;
}
