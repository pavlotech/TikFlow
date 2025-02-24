
import ModuleBuilder, { Module } from "src/core/services/module/module.builder.class";
import { Color } from "src/core/services/logger/logger.types";

function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export default new ModuleBuilder({ type: 'module' }, async (module: Module) => {
    const logs = async () => {
        // Базовые примеры
        module.logger.log("Пример стандартного лог-сообщения");
        module.logger.log("Пример сообщения БЕЗ даты", { noDate: true });
        module.logger.log("Пример сообщения с цветом", { color: Color.MAGENTA });
        module.logger.log("Радужный текст", { rainbow: true });

        module.logger.debug("Пример отладочного сообщения (debug)");
        module.logger.info("Пример информационного сообщения (info)");
        module.logger.warn("Пример предупреждения (warn)");
        module.logger.error("Пример ошибки (error)");

        module.logger.assert(1 + 1 === 3, "Упс! Тут ошибка в вычислении — assert!");

        module.logger.count("myCounter");
        module.logger.count("myCounter");
        module.logger.countReset("myCounter");
        module.logger.count("myCounter");

        const sampleObject = { foo: "bar", nested: { x: 10, y: 20 } };
        module.logger.dir(sampleObject);

        const xmlString = "<root><child>Пример XML</child></root>";
        module.logger.dirxml(xmlString);

        module.logger.group("MyGroup");
        module.logger.log("Сообщение внутри группы");
        module.logger.groupEnd();

        const people = [
            { name: "Alice", age: 25 },
            { name: "Bob", age: 30 },
            { name: "Chris", age: 28 },
        ];
        module.logger.table(people);

        module.logger.time("myTimer");
        // ... какой-то код ...
        module.logger.timeLog("myTimer", "Промежуточный результат");
        // ... ещё код ...
        module.logger.timeEnd("myTimer");

        module.logger.timeStamp("TestTimestamp");
        module.logger.trace("Пример stack trace");

        module.logger.profile("MyProfile");
        // ... некий код ...
        module.logger.profileEnd("MyProfile");

        // Пример обычного прогресс-бара (не в одной строке)
        module.logger.progress("Загрузка", 3, 10, 30);
        module.logger.progress("Загрузка", 10, 10, 30);

        // Пример пошагового (каждую секунду) прогресс-бара в одной строке (progressInline)
        const totalSteps = 10;
        module.logger.log("Начинаем пошаговую загрузку (progressInline)...");
        for (let i = 1; i <= totalSteps; i++) {
            await sleep(10000); // Ждём 1 секунду
            module.logger.progressInline("InlineLoad", i, totalSteps, 20);
        }
        module.logger.log("Пошаговая загрузка завершена!", { color: Color.GREEN });
    };

    // Запускаем функции
    logs();

    return module;
});
