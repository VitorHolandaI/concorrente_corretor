import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.concurrent.Semaphore;
import java.io.BufferedReader;
import java.io.FileReader;

public class DnaConcurrentMain {
    public static Semaphore s = new Semaphore(1);

    public static long contagem;
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Uso: java DnaSerialMain DIRETORIO_ARQUIVOS PADRAO");
            System.err.println("Exemplo: java DnaSerialMain dna_inputs CGTAA");
            System.exit(1);
        }

        String dirName = args[0];
        String pattern = args[1];

        File dir = new File(dirName);
        if (!dir.isDirectory()) {
            System.err.println("Caminho não é um diretório: " + dirName);
            System.exit(2);
        }

        File[] files = dir.listFiles((d, name) -> name.endsWith(".txt"));
        if (files == null || files.length == 0) {
            System.err.println("Nenhum arquivo .txt encontrado em: " + dirName);
            System.exit(3);
        }

        ArrayList<Thread> threads = new ArrayList<>();
            
	    for (File f : files) {
            Thread t = new Thread(new Work(f, pattern));    
            t.start();
            threads.add(t);
        }

        for (Thread t : threads) {
            try {
                t.join();
            } catch (InterruptedException e){

            }
        }

	    System.out.println("Sequência " + pattern + " foi encontrada " + contagem + " vezes.");
        
    }

    public static class Work implements Runnable {

        private final File file;
        private final String pattern;

        public Work(File file, String pattern) {
            this.file = file;
            this.pattern = pattern;
        }

        @Override
        public void run() {
            try {
                countInFile(file, pattern);
            } catch (IOException ex) {

            }
        }


        public static long countInFile(File file, String pattern) throws IOException {
            try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                String line;
                while ((line = br.readLine()) != null) {
                    line = line.trim();
                    if (!line.isEmpty()) {
                        contagem += countInSequence(line, pattern);
                    }
                }
            }
            return contagem;    
        }
    }


    public static long countInSequence(String sequence, String pattern) {
        if (sequence == null || pattern == null) {
            return 0;
        }
        int n = sequence.length();
        int m = pattern.length();
        if (m == 0 || n < m) {
            return 0;
        }
        long count = 0;
        for (int i = 0; i <= n - m; i++) {
            if (sequence.regionMatches(false, i, pattern, 0, m)) {
                count++;
            }
        }
        return count;
    }

}
